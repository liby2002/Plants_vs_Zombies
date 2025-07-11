/**
 * 游戏核心类
 * 管理游戏状态、游戏循环和所有游戏对象
 */
class Game {
  /**
   * 构造函数，初始化游戏
   * @param {HTMLCanvasElement} canvas 画布元素
   * @param {CanvasRenderingContext2D} ctx 画布绘图上下文
   */
  constructor(canvas, ctx) {
    // 画布和绘图上下文
    this.canvas = canvas;
    this.ctx = ctx;

    // ✅ 初始化草地图图片
    this.evenImg = new Image();
    this.evenImg.src = './images/straw.png';

    // 游戏网格设置
    this.ROWS = 5;            // 行数
    this.COLS = 9;            // 列数
    this.CELL_WIDTH = 100;    // 每个格子宽度
    this.CELL_HEIGHT = 110;   // 每个格子高度

    this.suns = []; // 阳光对象数组

    // 游戏对象存储
    this.plantGrid = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(null)); // 植物网格
    this.peas = [];           // 豌豆子弹数组
    this.zombies = [];        // 僵尸数组
    this.lawnMowers = Array.from({ length: this.ROWS }, (_, i) => new LawnMower(i)); // 每行一个小车

    // 游戏状态
    this.selectedPlantType = null; // 当前选中的植物类型
    this.sun = 1000;           // 当前阳光数量

    // DOM元素
    this.sunDisplay = document.getElementById('sun-value'); // 阳光显示元素
    // 游戏是否结束
    this.isGameOver = false;
    // 初始生成间隔：5秒
    this.zombieSpawnInterval = 10000;
    // 最快1秒一个
    this.minZombieSpawnInterval = 1000;
    // 僵尸生成速度
    this.minZombieSpawnInterval = 1000;      // 最小间隔 1 秒
    this.zombieSpawnDecreaseStep = 500;      // 每次减少 500ms
    this.zombieSpawnSpeedUpInterval = 30000; // 每 30 秒加快一次

    this.wave = 1;               // 当前波次
    this.waveZombieCount = 0;    // 当前波次僵尸总数
    this.waveZombiesKilled = 0;  // 当前波次已经杀死的僵尸数

    this.waveIntervals = [10000, 8000, 6000];  // 前三波刷怪间隔（毫秒）

    this.inEndlessMode = false;  // 是否进入无尽模式

    // 植物花费
    this.PLANT_COST = {
      peaShooter: 100, // 豌豆射手
      sunflower: 50, // 向日葵
      wallNut: 50, // 坚果墙花费
      chili: 150, // 🔥 新增火爆辣椒
      icePeaShooter: 125, // 新增寒冰射手
      melonShooter: 225, // 西瓜投手

    };

    // 植物冷却时间（毫秒）
    this.plantCooldown = {
      peaShooter: 7000,
      sunflower: 5000,
      wallNut: 50000, // 坚果冷却更长
      chili: 30000, // 🔥 火爆辣椒冷却较长
      icePeaShooter: 10000, // 新增寒冰射手
      melonShooter: 15000, // 西瓜投手
    };

    // 上次种植时间
    this.lastPlantTime = {
      peaShooter: 0,
      sunflower: 0,
      wallNut: 0,
      chili: 0,
      icePeaShooter: 0,
      melonShooter: 0, // 西瓜投手
    };

    // 选中按钮缓存
    this.plantButtons = {};
    document.querySelectorAll('.plant-button').forEach(btn => {
      const plantType = btn.getAttribute('data-plant');
      if (plantType) this.plantButtons[plantType] = btn;
    });

    this.cooldownLoop();
  }

  /**
   * 启动游戏
   */
  start() {
    this.startTime = Date.now();             // 游戏开始时间

    // 每10秒自动增加25阳光
    // setInterval(() => {
    //   this.sun += 15;
    //   this.updateSunDisplay();
    // }, 10000);

    let evenLoaded = false;
    let oddLoaded = false;

    this.evenImg.onload = () => {
      evenLoaded = true;
      if (evenLoaded && oddLoaded) this.gameLoop(); // 图片加载后再开始绘制
    };

    // 改为使用递归调度阳光掉落
    this.scheduleNextSunDrop();

    // 只调用一次，并延迟 3 秒
    setTimeout(() => this.scheduleNextZombieSpawn(), this.zombieSpawnInterval);

    // 启动游戏主循环
    this.gameLoop();
  }

  /**
   * 更新阳光显示
   */
  updateSunDisplay() {
    this.sunDisplay.innerText = this.sun;
  }

  /**
   * 随机生成僵尸
   */
  spawnZombieRandomly() {
    const row = Math.floor(Math.random() * this.ROWS);
    const rand = Math.random();

    let zombie;

    if (this.wave >= 4 && rand < 0.2) {
      // 第四波后 20% 概率刷铁桶僵尸
      zombie = new BucketheadZombie(row);
    } else if (this.wave >= 4 && rand < 0.5) {
      // 第四波后 30% 概率刷路障僵尸
      zombie = new ConeheadZombie(row);
    } else {
      // 前三波只刷普通僵尸，第四波后是默认兜底逻辑
      zombie = new Zombie(row);
    }

    this.zombies.push(zombie);

    // 统计当前波次生成的僵尸数
    if (!this.inEndlessMode) {
      this.waveZombieCount++;
    }
  }

  /**
   * 随着时间变化僵尸生成变快
   * @returns 
   */
  scheduleNextZombieSpawn() {
    if (this.isGameOver) return;

    // 防止重复调度
    if (this.zombieTimer) return;

    // 如果不是无尽模式，使用波次逻辑
    if (!this.inEndlessMode) {
      const targetCount = this.wave;  // 第一波1只，第二波2只，第三波3只

      // 如果当前波次生成数量还没达到目标，继续生成
      if (this.waveZombieCount < targetCount) {
        this.spawnZombieRandomly();

        this.zombieTimer = setTimeout(() => {
          this.zombieTimer = null;
          this.scheduleNextZombieSpawn();
        }, this.waveIntervals[this.wave - 1]); // 按波次间隔
      } else {
        // 等待所有当前波次僵尸被消灭后，进入下一波
        if (this.waveZombiesKilled >= targetCount) {
          this.wave++;                // 下一波
          this.waveZombieCount = 0;   // 重置计数
          this.waveZombiesKilled = 0;

          if (this.wave > 3) {
            // 进入无尽模式
            this.inEndlessMode = true;
            this.zombieSpawnInterval = 10000; // 重置为10秒起
            this.scheduleNextZombieSpawn();
          } else {
            // 下一波开始，递归调用
            this.scheduleNextZombieSpawn();
          }
        } else {
          // 等待僵尸被杀，定时检查
          this.zombieTimer = setTimeout(() => {
            this.zombieTimer = null;
            this.scheduleNextZombieSpawn();
          }, 1000); // 每秒检查一次
        }
      }

    } else {
      // 无尽模式逻辑，跟之前一样
      const elapsed = Date.now() - this.startTime;
      const level = Math.floor(elapsed / this.zombieSpawnSpeedUpInterval);
      const newInterval = Math.max(
        this.zombieSpawnInterval - level * this.zombieSpawnDecreaseStep,
        this.minZombieSpawnInterval
      );

      this.spawnZombieRandomly();

      this.zombieTimer = setTimeout(() => {
        this.zombieTimer = null;
        this.scheduleNextZombieSpawn();
      }, newInterval);
    }
  }

  /**
   * 处理画布点击事件
   * @param {MouseEvent} e 鼠标事件对象
   */
  handleCanvasClick(e) {
    if (!this.selectedPlantType) return; // 没有选中植物则不处理

    // 获取点击位置相对于画布的坐标
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算点击的网格位置
    const row = Math.floor(y / this.CELL_HEIGHT);
    const col = Math.floor(x / this.CELL_WIDTH);

    // 第一列是小车位置，不允许种植植物
    if (col === 0) return;

    // 如果选中铁锹，执行铲除
    if (this.selectedPlantType === 'shovel') {
      // 判断当前格子是否有植物
      const plant = this.plantGrid[row][col];
      if (plant) {
        // 移除植物
        this.plantGrid[row][col] = null;
        this.showMessage('成功铲掉小姜子！', 1500);
      } else {
        this.showMessage('这里已经没有小姜子可铲了！', 1500);
      }

      // 用完铁锹后取消选中
      this.selectedPlantType = null;
      document.querySelectorAll('.plant-button.selected, .tool-button.selected').forEach(b => b.classList.remove('selected'));

      return; // 不再处理种植等逻辑
    }

    // 检查是否可以种植植物
    if (this.selectedPlantType && this.PLANT_COST[this.selectedPlantType]) {
      if (this.sun < this.PLANT_COST[this.selectedPlantType]) {
        this.showMessage('💖不足！');
        return;
      }

      // 如果当前格子已有植物，不允许种植
      if (this.plantGrid[row][col] !== null) {
        this.showMessage('⚠️ 已有植物，不能重复种植！');
        return;
      }

      let plant;
      switch (this.selectedPlantType) {
        case 'peaShooter':
          plant = new PeaShooter(row, col, this);
          break;
        case 'sunflower':
          plant = new Sunflower(row, col, this);
          break;
        case 'wallNut':
          plant = new WallNut(row, col, this);
          break;
        case 'chili':
          plant = new Chili(row, col, this); // 🔥 新增火爆辣椒
          break;
        case 'icePeaShooter':
          plant = new IcePeaShooter(row, col, this);
          break;
        case 'melonShooter':
          plant = new MelonShooter(row, col, this);
          break;
        default:
          return;
      }

      this.plantGrid[row][col] = plant;
      this.sun -= this.PLANT_COST[this.selectedPlantType];
      this.updateSunDisplay();
      this.triggerPlantCooldown(this.selectedPlantType); // 新增冷却触发

      this.selectedPlantType = null;
      document.querySelectorAll('.plant-button').forEach(b => b.classList.remove('selected'));
    }

    // 检查是否点击到了阳光
    for (const sun of this.suns) {
      if (!sun.collected && sun.isClicked(x, y)) {
        sun.collected = true;
        this.sun += sun.value;       // 增加阳光
        this.updateSunDisplay();
        return; // 点击到阳光就不处理植物
      }
    }
  }

  /**
   * 绘制游戏网格
   */
  drawGrid() {
    this.ctx.strokeStyle = '#444'; // 网格线颜色

    // 绘制水平线
    for (let i = 0; i <= this.ROWS; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.CELL_WIDTH, i * this.CELL_HEIGHT);
      this.ctx.lineTo(this.canvas.width, i * this.CELL_HEIGHT);
      this.ctx.stroke();
    }

    // 绘制垂直线
    for (let j = 1; j <= this.COLS; j++) {
      this.ctx.beginPath();
      this.ctx.moveTo(j * this.CELL_WIDTH, 0);
      this.ctx.lineTo(j * this.CELL_WIDTH, this.canvas.height);
      this.ctx.stroke();
    }
  }

  /**
   * 游戏主循环
   */
  gameLoop() {
    if (this.isGameOver) return; // 游戏结束则停止绘制

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 使用图片替换颜色作为草坪背景
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 1; col < this.COLS; col++) {
        // const img = col % 2 === 0 ? this.evenImg : this.oddImg;

        // 强制向下取整，避免小数像素导致间隙
        const x = Math.floor(col * this.CELL_WIDTH);
        const y = Math.floor(row * this.CELL_HEIGHT);
        const w = Math.ceil(this.CELL_WIDTH);
        const h = Math.ceil(this.CELL_HEIGHT);

        this.ctx.drawImage(this.evenImg, x, y, w, h);
      }
    }


    // 绘制网格
    // this.drawGrid();

    // 更新和绘制所有小车
    this.lawnMowers.forEach(mower => {
      mower.update(this);
      mower.draw(this.ctx);
    });

    this.suns.forEach(sun => {
      sun.update();
      sun.draw(this.ctx);
    });

    // 更新和绘制植物
    this.updateAndDrawPlants();
    // 更新和绘制豌豆子弹
    this.updateAndDrawPeas();
    // 更新和绘制僵尸
    this.updateAndDrawZombies();
    // 生成阳光
    this.updateAndDrawSuns();

    // 递归调用，实现动画循环
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 更新和绘制所有植物
   */
  updateAndDrawPlants() {
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const plant = this.plantGrid[row][col];
        if (plant) {
          plant.update(this);  // 更新植物状态
          plant.draw(this.ctx); // 绘制植物
        }
      }
    }
  }

  /**
   * 更新和绘制所有豌豆子弹
   */
  updateAndDrawPeas() {
    for (let i = this.peas.length - 1; i >= 0; i--) {
      const p = this.peas[i];
      p.update();         // 更新子弹位置
      p.draw(this.ctx);   // 绘制子弹

      // 通用判断子弹是否失效
      // 假设所有子弹类有一个 isOutOfBounds() 方法，判断是否飞出画布或无效
      if (typeof p.isOutOfBounds === 'function' && p.isOutOfBounds(this.canvas)) {
        this.peas.splice(i, 1);
      }
    }
  }

  /**
   * 更新和绘制所有僵尸
   */
  updateAndDrawZombies() {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];

      if (z.isDead) {
        // 统计波次杀死数
        if (!z.countedDead) { // 防止重复计数
          z.countedDead = true;
          this.waveZombiesKilled++;
        }
        this.zombies.splice(i, 1);
        continue;
      }

      if (z.x <= 0 && !z.isDead) {
        this.endGame();
        return;
      }

      z.update(this);
      z.draw(this.ctx);

      this.checkZombiePeaCollisions(z, i);
      this.checkZombieLawnMowerCollisions(z);

      if (z.x <= 0 && !z.isDead) {
        this.endGame();
        return;
      }
    }
  }

  /**
   * 检查僵尸与豌豆子弹的碰撞
   * @param {Zombie} zombie 僵尸对象
   * @param {number} zombieIndex 僵尸在数组中的索引
   */
  checkZombiePeaCollisions(zombie, zombieIndex) {
    for (let j = this.peas.length - 1; j >= 0; j--) {
      const p = this.peas[j];

      // 判断是否在同一行
      if (zombie.row !== p.row) continue;

      // 不同子弹类型的碰撞检测写法不同
      if (p instanceof Melon) {
        // 简单的矩形碰撞检测
        if (p.x < zombie.x + zombie.width &&
          p.x + p.width > zombie.x &&
          p.y > zombie.y - zombie.height &&
          p.y - p.height < zombie.y) {
          zombie.hit(p.damage); // 传入子弹伤害
          this.peas.splice(j, 1); // 移除子弹
          break;
        }
      } else {
        // 默认圆形碰撞检测（比如豌豆射手）
        if (p.x + p.radius > zombie.x && p.x - p.radius < zombie.x + zombie.width) {
          zombie.hit();
          if (p instanceof IcePea) {
            zombie.slowUntil = Date.now() + 3000;
          }
          this.peas.splice(j, 1);
          break;
        }
      }
    }
  }

  /**
   * 检查僵尸与小车的碰撞
   * @param {Zombie} zombie 僵尸对象
   */
  checkZombieLawnMowerCollisions(zombie) {
    // 如果僵尸接近最左侧且小车未被使用
    if (!zombie.isDead && zombie.x < 100) {
      const mower = this.lawnMowers[zombie.row];
      if (!mower.used) mower.activate(); // 激活小车
    }
  }

  /**
   * 添加阳光的更新和绘制逻辑
   */
  updateAndDrawSuns() {
    for (let i = this.suns.length - 1; i >= 0; i--) {
      const sun = this.suns[i];
      sun.update();
      sun.draw(this.ctx);

      // 如果已被收集则移除
      if (sun.collected) {
        this.suns.splice(i, 1);
      }
    }
  }

  // 随机掉落阳光
  scheduleNextSunDrop() {
    const delay = Math.random() * 5000 + 5000; // 5~10 秒之间
    setTimeout(() => {
      const count = 1;
      const x = Math.random() * (this.canvas.width - 100) + 50;
      const y = Math.random() * 100 + 30;
      this.suns.push(new Sun(x, y));
      this.scheduleNextSunDrop(); // 递归调度下一次
    }, delay);
  }

  // 阳光不足时的提示
  showMessage(text, duration = 2000) {
    const box = document.getElementById('message-box');
    box.innerText = text;
    box.style.display = 'block';
    clearTimeout(this.messageTimeout); // 清除上一个定时器
    this.messageTimeout = setTimeout(() => {
      box.style.display = 'none';
    }, duration);
  }

  /**
 * 游戏结束逻辑
 */
  endGame() {


    if (this.isGameOver) return;

    this.isGameOver = true;

    // 显示游戏结束覆盖层
    const overlay = document.createElement('div');
    overlay.id = 'end-overlay';
    overlay.innerHTML = 
    `
    <div id="end-panel">
    <h1>游戏结束</h1>
    <p style="font-size:18px;">完蛋了，你让僵尸闯进小姜的房子了！</p>
    <button id="reload-btn">返 回</button>
    </div>
    `
    ;
    document.body.appendChild(overlay);

    // 点击按钮刷新页面
    document.getElementById('reload-btn').addEventListener('click', () => {
      location.reload();
    });
  }

  // 种植成功后调用，触发冷却
  triggerPlantCooldown(type) {
    this.lastPlantTime[type] = Date.now();
  }

  cooldownLoop() {
    const now = Date.now();

    Object.entries(this.plantButtons).forEach(([type, btn]) => {
      const cooldown = this.plantCooldown[type];
      const lastTime = this.lastPlantTime[type];
      const cost = this.PLANT_COST[type];
      const elapsed = now - lastTime;

      const bar = btn.querySelector('.cooldown-bar');
      if (!bar) return;

      let finalPercent = 0;
      let isDisabled = false;

      // 🌱 冷却状态判断
      if (elapsed < cooldown) {
        isDisabled = true;
        finalPercent = ((cooldown - elapsed) / cooldown) * 100;
      }

      // 💖 阳光不足判断
      if (this.sun < cost) {
        isDisabled = true;
        finalPercent = 100; // 显示为满遮罩
      }

      if (isDisabled) {
        btn.classList.add('disabled');
        bar.style.width = `${finalPercent}%`;
        // 若正选中该按钮，则取消选中
        if (this.selectedPlantType === type) {
          this.selectedPlantType = null;
          btn.classList.remove('selected');
        }
      } else {
        btn.classList.remove('disabled');
        bar.style.width = '0%';
      }
    });

    requestAnimationFrame(() => this.cooldownLoop());
  }
}