/**
 * 豌豆射手类（使用图片）
 * 代表游戏中的豌豆射手植物
 */
class PeaShooter {
  /**
   * 构造函数
   * @param {number} row 所在行
   * @param {number} col 所在列
   * @param {Game} game 游戏实例
   */
  constructor(row, col, game) {
    this.row = row;         // 所在行
    this.col = col;         // 所在列
    this.x = col * game.CELL_WIDTH + 10; // x坐标
    this.y = row * game.CELL_HEIGHT + 40; // y坐标
    this.cooldown = 0;      // 冷却时间
    this.shootInterval = 175; // 发射间隔（帧数）
    this.maxHealth = 100;   // 最大生命值
    this.health = this.maxHealth; // 当前生命值
    this.isDead = false;    // 是否死亡
    this.game = game;       // 游戏引用
    // 植物构造函数中
    this.location = col * game.CELL_WIDTH + game.CELL_WIDTH / 2; // 每个格子中心


    // 加载豌豆射手图片（只加载一次）
    if (!PeaShooter.image) {
      PeaShooter.image = new Image();
      PeaShooter.image.src = './images/peashooter.png'; // 🟡 你的植物图片路径
    }

    // 初始种下时若有僵尸则立即射击
    if (this.hasZombieAhead(game)) {
      this.shoot(game);
      this.cooldown = this.shootInterval;
    }
  }

  /**
   * 更新植物状态
   * @param {Game} game 游戏实例
   */
  update(game) {
    if (this.isDead) return;
    if (this.cooldown > 0) {
      this.cooldown--;
      return;
    }
    if (this.hasZombieAhead(game)) {
      this.shoot(game);
      this.cooldown = this.shootInterval;
    }
  }

  /**
   * 发射豌豆子弹
   * @param {Game} game 游戏实例
   */
  shoot(game) {
    game.peas.push(new Pea(this.x + 40, this.y - 30, this.row));
  }

  /**
   * 检查本行前方是否有僵尸
   * @param {Game} game 游戏实例
   * @returns {boolean}
   */
  hasZombieAhead(game) {
    return game.zombies.some(z =>
      !z.isDead &&
      z.row === this.row &&
      z.x + z.width > 120 &&   // 至少身体大部分进入画面
      z.x > this.x
    );
  }

  /**
   * 植物受到伤害
   * @param {number} amount 伤害值
   */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      this.game.plantGrid[this.row][this.col] = null;
    }
  }

  /**
   * 绘制豌豆射手
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.isDead) return;

    // 如果图片已加载完成，则绘制图片
    if (PeaShooter.image.complete) {
      ctx.drawImage(PeaShooter.image, this.x, this.y - 60, 60, 80); // 控制位置和大小
    } else {
      // 如果图片未加载完成，用默认矩形代替
      ctx.fillStyle = 'green';
      ctx.fillRect(this.x, this.y - 60, 40, 60);
    }
  }
}


/**
 * 向日葵类
 * 自动周期性地产生阳光
 */
class Sunflower {
  /**
   * 构造函数
   * @param {number} row 所在行
   * @param {number} col 所在列
   * @param {Game} game 游戏实例
   */
  constructor(row, col, game) {
    this.row = row;
    this.col = col;
    this.x = col * game.CELL_WIDTH + 20; // x坐标
    this.y = row * game.CELL_HEIGHT + 40; // y坐标
    this.health = 80;
    this.maxHealth = 80;
    this.isDead = false;
    this.game = game;
    this.sunInterval = 12000; // 每 8 秒生成阳光
    this.lastSunTime = Date.now();
    // 植物构造函数中
    this.location = col * game.CELL_WIDTH + game.CELL_WIDTH / 2; // 每个格子中心

    // 加载图片
    if (!Sunflower.image) {
      Sunflower.image = new Image();
      Sunflower.image.src = './images/sunflower.png';
    }
  }

  update(game) {
    if (this.isDead) return;

    // 生成阳光逻辑
    if (Date.now() - this.lastSunTime >= this.sunInterval) {
      const sunX = this.x + 20; // 水平方向居中
      const sunY = this.y - 150; // 🔺 在向日葵上方显示（适当向上偏移）
      game.suns.push(new Sun(sunX, sunY));
      this.lastSunTime = Date.now();
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      this.game.plantGrid[this.row][this.col] = null;
    }
  }

  draw(ctx) {
    if (this.isDead) return;
    if (Sunflower.image.complete) {
      ctx.drawImage(Sunflower.image, this.x, this.y - 60, 60, 80);
    } else {
      ctx.fillStyle = 'orange';
      ctx.fillRect(this.x, this.y - 60, 40, 60);
    }
  }
}

/**
 * 坚果墙：高血量，不攻击
 */
class WallNut {
  constructor(row, col, game) {
    this.row = row;
    this.col = col;
    this.game = game;

    this.health = 400; // 高生命值
    this.maxHealth = 400;
    this.x = col * game.CELL_WIDTH + 5;
    this.y = row * game.CELL_HEIGHT + -30;
    this.width = game.CELL_WIDTH;
    this.height = game.CELL_HEIGHT;

    this.image = new Image();
    this.image.src = './images/wallnut.png'; // 请准备好该图片
    // 植物构造函数中
    this.location = col * game.CELL_WIDTH + game.CELL_WIDTH / 2; // 每个格子中心
  }

  update(game) {
    if (this.isDead) return;
    // 坚果不做动作
  }

  draw(ctx) {
    if (this.isDead) return;
    ctx.drawImage(this.image, this.x, this.y, this.width - 10, this.height);
  }

  hit(damage = 100) {
    this.health -= damage;
    if (this.health <= 0) {
      this.game.plantGrid[this.row][this.col] = null;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
      this.game.plantGrid[this.row][this.col] = null;
    }
  }
}

/**
 * 火爆辣椒
 */
class Chili {
  constructor(row, col, game) {
    this.row = row;
    this.col = col;
    this.game = game;

    // 植物构造函数中
    this.location = col * game.CELL_WIDTH + game.CELL_WIDTH / 2; // 每个格子中心

    this.x = col * game.CELL_WIDTH + 20;
    this.y = row * game.CELL_HEIGHT + 40;
    this.width = 80;
    this.height = 80;

    this.exploded = false;
    this.explosionTime = Date.now(); // 爆炸时间记录

    // 加载图片
    this.img = new Image();
    this.img.src = './images/chili.png';
    this.img.onerror = () => {
      console.warn('🔥 火爆辣椒图片加载失败');
    };

    this.explosionTime = Date.now(); // 记录种植时间
    setTimeout(() => {
      this.explode();
    }, 500);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;

    // 清除该行所有僵尸
    this.game.zombies.forEach(z => {
      if (z.row === this.row) {
        z.isDead = true;
      }
    });

    // 播放爆炸动画或音效（如有）

    // 延迟 1 秒移除自己
    setTimeout(() => {
      this.game.plantGrid[this.row][this.col] = null;
    }, 1000);
  }

  update() {
    // 可以添加爆炸后渐隐或动画逻辑
  }

  draw(ctx) {
    const now = Date.now();

    // 🔥 绘制爆炸红线，仅在爆炸后1秒内显示
    if (this.exploded && now - this.explosionTime < 1000) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,0,0,0.6)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      const yMid = this.row * this.game.CELL_HEIGHT + this.game.CELL_HEIGHT * 0.5;
      ctx.beginPath();
      ctx.moveTo(this.game.CELL_WIDTH, yMid);
      ctx.lineTo(this.game.canvas.width, yMid);
      ctx.stroke();
      ctx.restore();
    }


    // 绘制辣椒本体
    if (this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y - 60, 60, 80);
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x + 10, this.y + 10, this.width, this.height);
    }
  }
}

/**
 * 寒冰射手类 - 继承自普通豌豆射手
 * 发射减速子弹（寒冰豌豆）
 */
class IcePeaShooter extends PeaShooter {
  constructor(row, col, game) {
    super(row, col, game); // 继承豌豆射手
    this.image = new Image();
    this.image.src = './images/icePeaShooter.png';
  }

  /**
   * 重写发射子弹方法，发射寒冰豌豆
   */
  shoot() {
    const icePea = new IcePea(this.row, this.col, this.game);
    this.game.peas.push(icePea);
  }

  /**
   * ✅ 重写绘制函数，使用寒冰射手图片
   */
  draw(ctx) {
    if (this.isDead) return;

    if (this.image.complete && this.image.naturalWidth !== 0) {
      ctx.drawImage(this.image, this.x, this.y - 60, 60, 80);
    } else {
      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(this.x, this.y - 60, 40, 60);
    }
  }
}

/**
 * 西瓜投手类 - 继承自豌豆射手
 */
class MelonShooter extends PeaShooter {
  constructor(row, col, game) {
    super(row, col, game);

    // 加载西瓜投手图片
    if (!MelonShooter.image) {
      MelonShooter.image = new Image();
      MelonShooter.image.src = './images/melonShooter.png'; // 请准备对应图片
      MelonShooter.image.onerror = () => {
        console.error('❌ 西瓜投手图片加载失败');
      };
    }

    this.shootInterval = 300; // 调整发射间隔，可以比豌豆射手慢一点
  }

  /**
   * 重写发射子弹方法，发射西瓜子弹
   */
  shoot() {
    let targetZombie = null;
    let minDistance = Infinity;
    for (const zombie of this.game.zombies) {
      if (zombie.row === this.row && !zombie.isDead) {
        const dist = zombie.x - this.x;
        if (dist > 0 && dist < minDistance) {
          minDistance = dist;
          targetZombie = zombie;
        }
      }
    }

    this.game.peas.push(new Melon(this.x, this.y, this.row, this.game, targetZombie));
  }

  /**
   * 绘制西瓜投手
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.isDead) return;

    if (MelonShooter.image.complete) {
      ctx.drawImage(MelonShooter.image, this.x, this.y - 60, 60, 80);
    } else {
      ctx.fillStyle = 'green';
      ctx.fillRect(this.x, this.y - 60, 40, 60);
    }
  }
}