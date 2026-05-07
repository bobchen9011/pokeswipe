/* ============================================
   PokeSwipe – Swipe Engine v4
   改進：
   - rAF 批次渲染（消除 mousemove 卡頓）
   - 速度偵測（快速輕掃也能觸發）
   - body.is-dragging class（全頁 grabbing 游標）
   - 拖曳方向即時 glow 效果（取代文字 stamp）
   - 縱向手勢偵測：垂直滑動不接管，讓瀏覽器正常捲動
   ============================================ */

class SwipeEngine {
  constructor(card, { onSwipeLeft, onSwipeRight, threshold = 90 }) {
    this.card         = card;
    this.onSwipeLeft  = onSwipeLeft;
    this.onSwipeRight = onSwipeRight;
    this.threshold    = threshold;

    this.startX     = 0;
    this.startY     = 0;
    this.startTime  = 0;
    this.moveX      = 0;
    this.moveY      = 0;
    this.isDragging = false;
    this.isMoving   = false;
    this.isVertical = false;   // 確認是縱向手勢後放棄接管
    this.destroyed  = false;

    // rAF state
    this._dirty   = false;
    this._rafId   = null;
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
      if (this.destroyed || this.isVertical) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - this.startX);
      const dy = Math.abs(t.clientY - this.startY);

      // 第一次移動 8px 以上才判斷方向
      if (!this.isMoving && (dx > 8 || dy > 8)) {
        if (dy > dx) {
          // 縱向手勢 → 放棄接管，恢復卡片狀態
          this.isVertical = true;
          this._cancelDrag();
          return;
        }
      }
      this._move(t.clientX, t.clientY);
    }, { passive: true });

    this.card.addEventListener('touchend', () => {
      if (this.destroyed) return;
      if (this.isVertical) { this.isVertical = false; return; }
      this._end();
    });

    this.card.addEventListener('touchcancel', () => {
      if (this.destroyed) return;
      this.isVertical = false;
      this._cancelDrag();
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

  _onMouseMove(e) { if (!this.destroyed) this._move(e.clientX, e.clientY); }
  _onMouseUp()    {
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
    this.isVertical = false;
    this.card.style.transition = 'none';
    document.body.classList.add('is-dragging');
  }

  /* 縱向放棄：不觸發任何 swipe，還原卡片 */
  _cancelDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('is-dragging');
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.card.style.transition =
      'transform .3s cubic-bezier(.25,.46,.45,.94), opacity .3s, box-shadow .3s';
    this.card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
    this.card.classList.remove('glow-right', 'glow-left');
    this.moveX = 0;
    this.moveY = 0;
  }

  _move(x, y) {
    if (!this.isDragging) return;
    this.moveX = x - this.startX;
    this.moveY = y - this.startY;

    if (!this.isMoving && Math.abs(this.moveX) > 8) this.isMoving = true;
    if (!this.isMoving) return;

    this._renderX = this.moveX;
    this._renderY = this.moveY;
    this._dirty   = true;

    if (!this._rafId) this._rafId = requestAnimationFrame(this._paintFrame);
  }

  _paintFrame() {
    this._rafId = null;
    if (!this._dirty || !this.isDragging) return;
    this._dirty = false;

    const rotate = this._renderX * 0.07;
    this.card.style.transform =
      `translateX(${this._renderX}px) translateY(${this._renderY * 0.25}px) rotate(${rotate}deg)`;

    // Live directional glow (replaces text stamps)
    const GLOW_THRESH = 38;
    if (this._renderX > GLOW_THRESH) {
      this.card.classList.add('glow-right');
      this.card.classList.remove('glow-left');
    } else if (this._renderX < -GLOW_THRESH) {
      this.card.classList.add('glow-left');
      this.card.classList.remove('glow-right');
    } else {
      this.card.classList.remove('glow-right', 'glow-left');
    }
  }

  _end() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('is-dragging');

    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

    this.card.style.transition =
      'transform .42s cubic-bezier(.25,.46,.45,.94), opacity .42s, box-shadow .3s';

    const elapsed  = Math.max(1, Date.now() - this.startTime);
    const velocity = this.moveX / elapsed;
    const isFlick  = Math.abs(velocity) > 0.4 && Math.abs(this.moveX) > 30;

    if (this.moveX > this.threshold || (isFlick && this.moveX > 0)) {
      this._flyOut('right');
    } else if (this.moveX < -this.threshold || (isFlick && this.moveX < 0)) {
      this._flyOut('left');
    } else {
      // Snap back — remove glow
      this.card.style.transform = 'translateX(0) translateY(0) rotate(0deg)';
      this.card.classList.remove('glow-right', 'glow-left');
    }
    this.moveX = 0;
    this.moveY = 0;
  }

  _flyOut(dir) {
    this.destroyed = true;
    const vw = window.innerWidth;
    const x  = dir === 'right' ? vw + 260 : -(vw + 260);
    const r  = dir === 'right' ? 28 : -28;

    this.card.style.transition =
      'transform .48s cubic-bezier(.4,0,.2,1), opacity .48s';
    this.card.style.transform   = `translateX(${x}px) rotate(${r}deg)`;
    this.card.style.opacity     = '0';
    this.card.style.pointerEvents = 'none';

    setTimeout(() => {
      if (dir === 'right' && this.onSwipeRight) this.onSwipeRight();
      if (dir === 'left'  && this.onSwipeLeft)  this.onSwipeLeft();
    }, 360);
  }

  /* ───────── Programmatic trigger (button / keyboard) ───────── */
  triggerSwipe(dir) {
    if (this.destroyed) return;
    // Quick glow flash before fly-out
    this.card.classList.add(dir === 'right' ? 'glow-right' : 'glow-left');
    setTimeout(() => this._flyOut(dir), 120);
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
