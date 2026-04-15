/* ============================================
   PokeSwipe – Swipe Engine v3
   ============================================
   改進（v3）：
   - 方向鎖定（_lockDir）：手勢確認為垂直時立即放棄，
     不干擾頁面滾動，消除誤觸和彈跳感
   - transition = 'none' 延遲到確認水平方向後才套用，
     避免 touchstart 就凍結滾動動畫
   - 快取 stamp DOM 元素，省去每幀 querySelector
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
    this.destroyed  = false;

    // null = 尚未確定，'h' = 水平，'v' = 垂直
    this._lockDir = null;

    // rAF 狀態
    this._dirty   = false;
    this._rafId   = null;
    this._renderX = 0;
    this._renderY = 0;

    // 快取 stamp 元素，避免每幀 querySelector
    this._skipStamp = card.querySelector('.swipe-stamp--skip');
    this._addStamp  = card.querySelector('.swipe-stamp--add');

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
    this._lockDir   = null;
    // 注意：transition = 'none' 故意延遲到確認水平方向後才設，
    // 避免 touchstart 就打斷垂直滾動的慣性動畫
  }

  _move(x, y) {
    if (!this.isDragging) return;
    this.moveX = x - this.startX;
    this.moveY = y - this.startY;

    // ── 方向鎖定：累積足夠位移後才決定 ──
    if (this._lockDir === null) {
      const absX = Math.abs(this.moveX);
      const absY = Math.abs(this.moveY);
      if (absX < 5 && absY < 5) return;   // 還不夠，等更多位移
      this._lockDir = absX >= absY ? 'h' : 'v';
    }

    // ── 垂直手勢：放棄追蹤，還原狀態，讓瀏覽器處理滾動 ──
    if (this._lockDir === 'v') {
      this._abort();
      return;
    }

    // ── 水平手勢：這裡才凍結 transition，開始渲染拖曳 ──
    if (this.card.style.transition !== 'none') {
      this.card.style.transition = 'none';
      document.body.classList.add('is-dragging');
    }

    this._renderX = this.moveX;
    this._renderY = this.moveY;
    this._dirty   = true;

    if (!this._rafId) {
      this._rafId = requestAnimationFrame(this._paintFrame);
    }
  }

  /* 中途放棄（垂直手勢）：清掉狀態，不觸發任何 callback */
  _abort() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.isDragging = false;
    // 不需要改 transform，因為水平還沒開始移動
    document.body.classList.remove('is-dragging');
  }

  _paintFrame() {
    this._rafId = null;
    if (!this._dirty || !this.isDragging) return;
    this._dirty = false;

    const rotate = this._renderX * 0.07;
    this.card.style.transform =
      `translateX(${this._renderX}px) translateY(${this._renderY * 0.25}px) rotate(${rotate}deg)`;

    // 使用快取的 stamp 元素
    if (this._skipStamp)
      this._skipStamp.style.opacity = Math.min(1, Math.max(0, -this._renderX / this.threshold));
    if (this._addStamp)
      this._addStamp.style.opacity  = Math.min(1, Math.max(0,  this._renderX / this.threshold));
  }

  _end() {
    if (!this.isDragging) return;
    this.isDragging = false;
    document.body.classList.remove('is-dragging');

    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

    // 垂直方向或根本沒移動（點擊）→ 不做任何事
    // （_abort 在 _move 裡已處理了垂直手勢，這裡只處理「幾乎沒位移」的點擊）
    if (!this._lockDir || this._lockDir === 'v') return;

    this.card.style.transition =
      'transform .42s cubic-bezier(.25,.46,.45,.94), opacity .42s';

    // 速度偵測：快速輕掃也能觸發
    const elapsed  = Math.max(1, Date.now() - this.startTime);
    const velocity = this.moveX / elapsed; // px/ms
    const isFlick  = Math.abs(velocity) > 0.4 && Math.abs(this.moveX) > 30;

    if (this.moveX > this.threshold || (isFlick && this.moveX > 0)) {
      this._flyOut('right');
    } else if (this.moveX < -this.threshold || (isFlick && this.moveX < 0)) {
      this._flyOut('left');
    } else {
      // 彈回原位
      this.card.style.transform = 'none';
      if (this._skipStamp) this._skipStamp.style.opacity = '0';
      if (this._addStamp)  this._addStamp.style.opacity  = '0';
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
    const stamp = dir === 'right' ? this._addStamp : this._skipStamp;
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
