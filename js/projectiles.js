/**
 * 豌豆子弹类
 * 代表豌豆射手发射的子弹
 */
class Pea {
  /**
   * 构造函数
   * @param {number} x 初始x坐标
   * @param {number} y 初始y坐标
   * @param {number} row 所在行
   */
  constructor(x, y, row) {
    this.x = x;       // x坐标
    this.y = y;       // y坐标
    this.row = row;   // 所在行
    this.speed = 3.5;   // 移动速度
    this.radius = 8;  // 半径大小
    this.image = new Image();
    this.image.src = '../images/pea/pea.png';
    this.width = 32;   // 或根据图片大小设定
    this.height = 32;
  }

  /**
   * 更新子弹位置
   */
  update() {
    this.x += this.speed; // 向右移动
  }

  /**
   * 绘制子弹
   * @param {CanvasRenderingContext2D} ctx 画布上下文
   */
  draw(ctx) {
    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.drawImage(this.image, this.x, this.y - this.height / 2, this.width, this.height);
    } else {
      // 图片未加载好，暂时用蓝色圆形代替
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 寒冰豌豆子弹类 - 带有减速效果的子弹
 */
class IcePea {
  constructor(row, col, game) {
    this.row = row;
    this.x = (col + 0.5) * game.CELL_WIDTH; // 初始位置在植物正前方
    this.y = row * game.CELL_HEIGHT + 40;
    this.radius = 8;
    this.speed = 3;
    this.color = '#00CCFF'; // 冰蓝色
    this.game = game;
    this.isIce = true; // 新增：标记为寒冰子弹
    this.image = new Image();
    this.image.src = '../images/pea/icePea.png';
    this.width = 32;   // 或根据图片大小设定
    this.height = 32;

  }

  /**
   * 更新子弹位置
   */
  update() {
    this.x += this.speed;
  }

  /**
   * 绘制子弹
   */
  draw(ctx) {
    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.drawImage(this.image, this.x, this.y - this.height / 2, this.width, this.height);
    } else {
      // 图片未加载好，暂时用蓝色圆形代替
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * 西瓜子弹类（抛物线运动）
 */
class Melon {
  constructor(x, y, row, game, target) {
    this.x0 = x;        // 起点x
    this.y0 = y;        // 起点y（西瓜投手手上位置）
    this.x = x;
    this.row = row;
    this.game = game;

    this.damage = 35; // 子弹伤害
    this.width = 30;
    this.height = 30;

    this.image = new Image();
    this.image.src = '../images/pea/melon.png';

    if (target) {
      this.targetX = target.x;
      this.targetY = target.y;

      this.x1 = this.targetX;  // 终点x
      this.y1 = this.targetY;  // 终点y

      this.peakHeight = 160; // 抛物线最高点距起点的高度（固定）

      this.totalFrames = 120;  // 抛物线总动画帧数，控制飞行时间，帧数越大飞得越慢
      this.frame = 0;

    } else {
      // 没有目标，使用简单水平飞行
      this.vx = 3;
      this.vy = 0;
      this.g = 0;
    }
  }

  update() {
    if (this.targetX !== undefined) {
      this.frame++;
      if (this.frame > this.totalFrames) {
        this.game.peas = this.game.peas.filter(p => p !== this);
        return;
      }

      const t = this.frame / this.totalFrames;
      this.x = this.x0 + (this.x1 - this.x0) * t;

      const h = this.peakHeight;
      const x0 = this.x0;
      const x1 = this.x1;
      const yTop = this.y0 - h; // 顶点高度在上方

      // 抛物线：从 y0 抛向目标，顶点在 y0 - h
      const a = 4 * (this.y0 - yTop) / Math.pow(x1 - x0, 2);
      this.y = a * (this.x - x0) * (this.x - x1) + this.y0;

    } else {
      // 无目标逻辑
      this.x += this.vx;
      this.vy += this.g;
      this.y += this.vy;
    }

    // 碰撞检测
    for (const zombie of this.game.zombies) {
      if (!zombie.isDead && zombie.row === this.row &&
        this.x + this.width > zombie.x && this.x < zombie.x + zombie.width &&
        this.y + this.height > zombie.y - zombie.height && this.y < zombie.y) {
        zombie.hit(this.damage);
        this.game.peas = this.game.peas.filter(p => p !== this);
        break;
      }
    }

    // 出界处理
    // if (this.x > this.game.canvas.width || this.y > this.game.canvas.height || this.y < 0) {
    //   this.game.peas = this.game.peas.filter(p => p !== this);
    // }
  }

  draw(ctx) {
    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
    } else {
      ctx.fillStyle = 'darkgreen';
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y - this.height / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}