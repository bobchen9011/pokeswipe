/* ============================================
   PokeSwipe – Swipe Engine v2
   ============================================
   改進：
   - requestAnimationFrame 批次渲染（消除 mousemove 卡頓）
   - 速度偵測（快速輕掃也能觸發）
   - body.is-dragging class（讓游標在整個頁面維持 grabbing）
   ============================================ */

class SwipeEngine {
  constructor(card, { onSwipeLeft, onSwipeRight, threshold = 90 }) {
    this.card         = card;
    this.onSwipeLeft  = onSwipeLeft;
    this.onSwipeRight = onSwipeRight;
    this.threshold    = threshold;

    this.startX    = 0;
    this.startY    = 0;
    this.startTime = 0;
    this.moveX     = 0;
    this.moveY     = 0;
    this.isDragging = false;
    this.isMoving   = false;
    this.destroyed  = false;

    // rAF state
    this._dirty  = false;
    this._rafId  = null;
    this._renderX = 0;
    this._renderY = 0;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp   = this._onMouseUp.bind(this);
    this._paintFrame  = this._paintFrame.bind(this);

    this._bindTouch();
    this._bindMouse();
  }

  /* ───────── Touch ───────── */
  _bindTouch() {
    this.card.addEventListener('touchstart', (e) => {
      if (this.destroyed) return;
      const t = e.touches[0];
      this._start(t.clientX, t.clientY);
    }, { passive: true });

    this.card.addEventListener('touchmove', (e) => {
      if (this.destroyed) return;
      const t = e.touches[0];
      this._move(t.clientX, t.clientY);
    }, { passive: true });

    this.card.addEventListener('touchend', () => {
      if (this.destroyed) return;
      this._end();
    });
  }

  /* ───────── Mouse ───────── */
  _bindMouse() {
    this.card.addEventListener('mousedown', (e) => {
      if (this.destroyed) return;
      e.preventDefault();
      this._start(e.clientX, e.clientY);
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup',   this._onMouseUp);
    });
  }

  _onMouseMove(e) {
    if (!this.destroyed) this._move(e.clientX, e.clientY);
  }

  _onMouseUp() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup',   this._onMouseUp);
    if (!this.destroyed) this._end();
  }

  /* ───────── Core ───────── */
  _start(x, y) {
    this.startX    = x;
    this.startY    = y;
    this.startTime = Date.now();
    this.moveX     = 0;
    this.moveY     = 0;
    this.isDragging = true;
    this.isMoving   = false;
    this.card.style.transition = 'none';
    document.body.classList.add('is-dragging');
  }

  _move(x, y) {
    if (!this.isDragging) return;
    this.moveX = x - this.startX;
    this.moveY = y - this.startY;

    if (!this.isMoving && Math.abs(this.moveX) > 8) {
      this.isMoving = true;
    }
    if (!this.isMoving) return;

    // Store render values and schedule ONE rAF
    this._renderX = this.moveX;
    this._renderY = this.moveY;
    this._dirty   = true;

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(this._paintFrame);
    }
  }

  _paintFrame() {
    this._rafId = null;
    if (!this._dirty || !this.isDragging) return;
    this._dirty = false;

    const rotate = this._renderX * 0.07;
    this.card.style.transform =
      `translateX(${this._renderX}px) translateY(${this._renderY * 0.25}px) rotate(${rotate}deg)`;

    const ratio = Math.abs(this._renderX) / this.threshold;
    const skipStamp = this.card.querySelector('.swipe-stamp--skip');
    const addStamp  = this.card.querySelector('.swipe-stamp--add');
    if (skipStamp) skipStamp.style.opacity = Math.min(1, Math.max(0, -this._renderX / this.threshold));
    if (addStamp)  addStamp.style.opacity  = Math.min(1, Math.max(0,  this._renderX / this.threshold));
  }

  _end() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('is-dragging');

    // Cancel any pending rAF
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

    this.card.style.transition =
      'transform .42s cubic-bezier(.25,.46,.45,.94), opacity .42s';

    // Velocity swipe: fast flick with lower travel also triggers
    const elapsed  = Math.max(1, Date.now() - this.startTime);
    const velocity = this.moveX / elapsed; // px/ms
    const isFlick  = Math.abs(velocity) > 0.4 && Math.abs(this.moveX) > 30;

    if (this.moveX > this.threshold || (isFlick && this.moveX > 0)) {
      this._flyOut('right');
    } else if (this.moveX < -this.threshold || (isFlick && this.moveX < 0)) {
      this._flyOut('left');
    } else {
      // Snap back
      this.card.style.transform = 'scale(1) translateY(0)';
      const skipStamp = this.card.querySelector('.swipe-stamp--skip');
      const addStamp  = this.card.querySelector('.swipe-stamp--add');
      if (skipStamp) skipStamp.style.opacity = '0';
      if (addStamp)  addStamp.style.opacity  = '0';
    }
    this.moveX = 0;
    this.moveY = 0;
  }

  _flyOut(dir) {
    this.destroyed = true;
    const vw = window.innerWidth;
    const x  = dir === 'right' ? vw + 250 : -(vw + 250);
    const r  = dir === 'right' ? 28 : -28;

    this.card.style.transition =
      'transform .48s cubic-bezier(.4,0,.2,1), opacity .48s';
    this.card.style.transform  = `translateX(${x}px) rotate(${r}deg)`;
    this.card.style.opacity    = '0';
    this.card.style.pointerEvents = 'none';

    setTimeout(() => {
      if (dir === 'right' && this.onSwipeRight) this.onSwipeRight();
      if (dir === 'left'  && this.onSwipeLeft)  this.onSwipeLeft();
    }, 360);
  }

  /* ───────── Programmatic (buttons / keyboard) ───────── */
  triggerSwipe(dir) {
    if (this.destroyed) return;
    const stamp = this.card.querySelector(
      dir === 'right' ? '.swipe-stamp--add' : '.swipe-stamp--skip'
    );
    if (stamp) stamp.style.opacity = '1';
    setTimeout(() => this._flyOut(dir), 110);
  }

  /* ───────── Cleanup ───────── */
  destroy() {
    this.destroyed = true;
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    document.body.classList.remove('is-dragging');
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup',   this._onMouseUp);
  }
}
