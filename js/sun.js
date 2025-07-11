class Sun {
    constructor(x, y) {
        this.x = x;                   // 当前x坐标
        this.y = y;                   // 当前y坐标
        this.targetY = y + 100;       // 掉落目标y坐标
        this.radius = 20;             // 半径
        this.speed = 1;               // 掉落速度
        this.value = 25;              // 阳光数值

        this.collected = false;       // 是否被收集
        this.landedTime = null;       // 落地时间
        this.stayDuration = 5000;     // 停留时间（毫秒）
        this.fadeDuration = 2000;     // 逐渐透明时间（毫秒）
        this.opacity = 1;             // 当前透明度（1~0）

        // 新增图片相关属性
        this.img = new Image();
        this.img.src = '../images/love.png'; // 图片路径
        this.img.onload = () => {
            this.imageLoaded = true;
        };
        this.img.onerror = () => {
            console.error('阳光图片加载失败');
            this.imageFailed = true;
        };
        this.imageLoaded = false;
        this.imageFailed = false;
        this.width = 40;             // 图片显示宽度
        this.height = 40;             // 图片显示高度
    }

    update() {
        if (this.collected) return;

        // 还在下落中
        if (this.y < this.targetY) {
            this.y += this.speed;
            if (this.y >= this.targetY) {
                this.landedTime = Date.now(); // 到达目标位置，开始计时
            }
        } else {
            const elapsed = Date.now() - this.landedTime;

            // 进入淡出阶段（超过停留时间）
            if (elapsed > this.stayDuration) {
                const fadeElapsed = elapsed - this.stayDuration;
                this.opacity = 1 - fadeElapsed / this.fadeDuration;

                // 如果完全透明，则作废
                if (this.opacity <= 0) {
                    this.collected = true;
                }
            }
        }
    }

    draw(ctx) {
        if (this.collected) return;

        ctx.save(); // 保存上下文状态
        ctx.globalAlpha = this.opacity; // 设置透明度

        if (this.imageLoaded && !this.imageFailed) {
            // 使用图片绘制
            ctx.drawImage(
                this.img,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            // 图片加载失败时使用备用绘制
            ctx.beginPath();
            ctx.fillStyle = '#FFD700';
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.stroke();
        }

        // 绘制 +25 文字
        // ctx.fillStyle = '#000';
        // ctx.font = '12px Arial';
        // ctx.textAlign = 'center';
        // ctx.fillText('+25', this.x, this.y + 5);

        ctx.restore(); // 恢复透明度
    }

    isClicked(mouseX, mouseY) {
        if (this.collected) return false;
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}