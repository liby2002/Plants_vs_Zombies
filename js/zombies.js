/**
 * 僵尸类
 * 代表游戏中的僵尸敌人
 */
class Zombie {
    /**
     * 构造函数
     * @param {number} row 所在行
     */
    constructor(row) {
        this.row = row;         // 所在行
        this.x = 900;           // 初始x坐标(画布右侧外)
        this.y = row * 100 + 100; // y坐标
        this.width = 90;        // 宽度
        this.height = 120;       // 高度
        this.speed = 0.3;       // 移动速度
        this.isDead = false;    // 是否死亡
        this.maxHealth = 100;   // 最大生命值
        this.health = this.maxHealth; // 当前生命值
        this.img = this.loadImage(); // 加载图片
        this.imageFailed = false; // 图片加载是否失败
        this.hurtTime = 0;
        // 僵尸类中新增属性
        this.slowUntil = 0; // 减速持续时间
    }

    /**
     * 加载僵尸图片
     * @returns {HTMLImageElement} 图片元素
     */
    loadImage() {
        const img = new Image();
        // 图片路径 - 根据实际项目结构调整
        img.src = './images/basicZombee.png';
        // 图片加载失败处理
        img.onerror = () => {
            console.error('Failed to load car image');
            this.imageFailed = true;
        };
        return img;
    }

    /**
     * 更新僵尸状态
     * @param {Game} game 游戏实例
     */
    update(game) {
        if (this.isDead) return;

        const now = Date.now();
        const plantsInRow = game.plantGrid[this.row];
        let attacked = false;

        // 默认速度和攻击伤害
        let currentSpeed = this.speed;
        let attackDamage = 0.2;

        // 如果是减速状态
        const isSlowed = this.slowUntil && now < this.slowUntil;
        if (isSlowed) {
            currentSpeed *= 0.5;    // 移动速度减半
            attackDamage *= 0.5;    // 攻击减半（也可以用冷却替代）
        }

        // 僵尸攻击植物判断
        for (let col = 0; col < game.COLS; col++) {
            const plant = plantsInRow[col];
            if (plant && !plant.isDead) {
                console.log("僵尸：" + this.x, " ===> 植物：" + plant.location);
                console.log("攻击：" + (this.x - plant.location));
                // 校验僵尸与植物之间的距离
                if ((this.x <= plant.location + 10) && (this.x - plant.location <= 0 && this.x -plant.location >= -50)) {
                    plant.takeDamage(attackDamage);
                    attacked = true;
                    break; // 只攻击一个植物
                }
            }
        }


        // 没有攻击就继续移动
        if (!attacked) {
            this.x -= currentSpeed;
        }
    }

    /**
 * 绘制僵尸
 * @param {CanvasRenderingContext2D} ctx 画布上下文
 */
    draw(ctx) {
        const now = Date.now(); // ✅ 添加
        const isHurt = now - this.hurtTime < 300;
        const isSlowed = this.slowUntil && now < this.slowUntil;

        if (isHurt) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        } else if (isSlowed) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        }

        if (this.isDead) return;

        const img = this.img || this.image; // 优先使用 this.img

        if (img && img.complete && img.naturalWidth !== 0) {
            ctx.drawImage(img, this.x, this.y - this.height, this.width, this.height);
        } else {
            ctx.fillStyle = 'brown';
            ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
        }
    }

    /**
     * 僵尸受到伤害
     */
    hit(damage = 14) {
        this.health -= damage;
        this.hurtTime = Date.now();
        if (this.health <= 0) {
            this.isDead = true;
        }
    }
}

/**
 * 路障僵尸
 */
class ConeheadZombie extends Zombie {
    constructor(row) {
        super(row); // 继承基础僵尸属性

        this.maxHealth = 250;
        this.health = this.maxHealth;        // 比普通僵尸略慢

        // 路障图片
        if (!ConeheadZombie.image) {
            ConeheadZombie.image = new Image();
            ConeheadZombie.image.src = './images/RoadblockZombie.png'; // 路障僵尸图片路径
        }

        this.img = ConeheadZombie.image;
    }
}

/**
 * 铁桶僵尸
 */
class BucketheadZombie extends Zombie {
    constructor(row) {
        super(row); // 继承 Zombie 的构造逻辑

        this.maxHealth = 350; // 铁桶僵尸血量更高
        this.health = this.maxHealth;
        this.speed = 0.3;

        // 加载铁桶僵尸图片（只加载一次）
        if (!BucketheadZombie.image) {
            BucketheadZombie.image = new Image();
            BucketheadZombie.image.src = './images/IronBucketZombie.png'; // 替换为实际路径
        }

        this.img = BucketheadZombie.image;
    }

}


/**
 * 割草机(小车)类
 * 代表游戏中的防御性小车
 */
class LawnMower {
    /**
     * 构造函数
     * @param {number} row 所在行
     */
    constructor(row) {
        this.row = row;
        this.x = -100; // 初始x坐标，画布左侧外（负值）
        this.y = row * 100 + 100; // y坐标，根据行数计算
        this.width = 100; // 小车宽度
        this.height = 100; // 小车高度
        this.speed = 0; // 当前速度，0表示静止
        this.used = false; // 是否已使用（冲出去过）
        this.entering = true; // 是否正在“开进来”的动画
        this.img = this.loadImage(); // 加载小车图片
        this.imageFailed = false; // 图片是否加载失败标志
    }

    /**
     * 加载图片
     * @returns {HTMLImageElement}
     */
    loadImage() {
        const img = new Image();
        img.src = './images/car.png'; // 图片路径，注意项目结构
        img.onerror = () => {
            console.error('Failed to load car image');
            this.imageFailed = true;
        };
        return img;
    }

    /**
     * 激活小车（冲出去消灭僵尸）
     */
    activate() {
        // 只有进入动画完成后，且没用过才激活
        if (!this.used && !this.entering) {
            this.speed = 5; // 设置冲出去的速度
            this.used = true;
        }
    }

    /**
     * 更新小车状态
     * @param {Game} game 游戏实例
     */
    update(game) {
        if (this.entering) {
            // 进入动画，慢慢从画布外左侧移动到x=10
            if (this.x < 10) {
                this.x += 2; // 调整速度
            } else {
                this.entering = false; // 进入结束，停下等待激活
                this.speed = 0;
            }
            return; // 进入时不检测碰撞
        }

        // 激活后小车冲出去
        if (this.speed > 0) {
            this.x += this.speed;

            // 超出画布宽度时停止
            if (this.x > game.canvas.width) {
                this.speed = 0;
                this.used = true;
                return;
            }

            // 碰撞检测，撞到同一行的僵尸就消灭
            game.zombies.forEach(z => {
                if (!z.isDead && z.row === this.row && z.x < this.x + this.width) {
                    z.hit();
                }
            });
        }
    }

    /**
     * 绘制小车
     * @param {CanvasRenderingContext2D} ctx 画布上下文
     */
    draw(ctx) {
        // 只要小车没用完或还在画布范围内就画出来
        if (!this.used || this.x < 900) {
            if (!this.imageFailed && this.img.complete && this.img.naturalWidth !== 0) {
                ctx.drawImage(this.img, this.x, this.y - this.height, this.width, this.height);
            } else {
                // 图片加载失败，绘制简易小车图形
                ctx.fillStyle = 'gray';
                ctx.fillRect(this.x, this.y - this.height, this.width, this.height);

                ctx.fillStyle = 'red';
                ctx.fillRect(this.x + 10, this.y - this.height + 10, 20, 20);
                ctx.fillRect(this.x + 70, this.y - this.height + 10, 20, 20);

                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(this.x + 25, this.y - 20, 15, 0, Math.PI * 2);
                ctx.arc(this.x + 75, this.y - 20, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
