/**
 * 主游戏入口文件
 * 负责初始化游戏并设置事件监听器
 */
document.addEventListener('DOMContentLoaded', () => {
    // 获取画布和绘图上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 初始化游戏实例
    const game = new Game(canvas, ctx);

    // ✅ 合并后绑定点击事件，避免重复绑定和冲突
    document.querySelectorAll('.plant-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const plant = btn.dataset.plant;

            // 冷却中，禁止点击
            if (btn.classList.contains('disabled')) return;

            // 如果当前按钮已经被选中，则取消选中
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                game.selectedPlantType = null;
            } else {
                // 否则先取消其他按钮选中，再选中当前按钮
                document.querySelectorAll('.plant-button.selected, .tool-button.selected')
                    .forEach(b => b.classList.remove('selected'));

                btn.classList.add('selected');
                game.selectedPlantType = plant;
            }
        });
    });

    // 绑定铁锹按钮点击事件
    document.getElementById('shovel-button').addEventListener('click', () => {
        // 取消所有按钮选中状态
        document.querySelectorAll('.plant-button.selected, .tool-button.selected').forEach(btn => btn.classList.remove('selected'));

        // 设置当前选中为铁锹
        game.selectedPlantType = 'shovel';

        // 给铁锹按钮添加选中样式
        document.getElementById('shovel-button').classList.add('selected');
    });

    // 绑定画布点击事件
    game.canvas.addEventListener('click', e => game.handleCanvasClick(e));



    // 合并的canvas点击事件：先收集阳光，没点中执行种植逻辑
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 优先检查是否点中阳光
        for (let i = 0; i < game.suns.length; i++) {
            const sun = game.suns[i];
            if (sun.isClicked(x, y)) {
                sun.collected = true;
                game.sun += sun.value;
                game.updateSunDisplay();
                return;
            }
        }

        game.handleCanvasClick(e);
    });

    // 为画布添加点击事件监听器
    canvas.addEventListener('click', (e) => game.handleCanvasClick(e));

    // ✅ 创建开始游戏确认框
    const overlay = document.createElement('div');
    overlay.id = 'start-overlay';
    overlay.innerHTML =
        `
    <div id="start-panel">
        <h1>欢迎来到小姜大战僵尸</h1>
        <p style="font-size:20px;margin-bottom:20px;">准备好守卫小姜的花园了吗？</p>
        <div class="button-group">
            <button id="start-btn">开始游戏</button>
            <label style="font-size: 16px; margin-top: 10px; display: inline-block;">
                <input type="checkbox" id="music-checkbox" checked />
                    🎵 游戏音乐
            </label>
        </div>
    </div>
    `;
    document.body.appendChild(overlay);

    // 按钮点击后开始游戏并移除覆盖层
    document.getElementById('start-btn').addEventListener('click', () => {
        // 先获取复选框的布尔值
        const musicChecked = document.getElementById('music-checkbox').checked;

        // 获取音频元素
        const bgMusic = document.getElementById('bg-music');

        if (musicChecked) {
            // ✅ 选中时开启音乐：取消静音并尝试播放
            bgMusic.muted = false;
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    console.warn("音频自动播放失败：", err);
                });
            }
        } else {
            // ❌ 未选中则保持静音并暂停
            bgMusic.muted = true;
            bgMusic.pause();
        }


        document.body.removeChild(overlay); // 移除遮罩

        // ✅ 显示顶部工具栏
        const topBar = document.getElementById('top-bar-container');
        if (topBar) {
            topBar.style.display = 'flex'; // 或 'block'，视你页面样式而定
        }

        game.start(); // 启动游戏主循环

        // 触发植物按钮从右侧滑入动画
        const buttons = document.querySelectorAll('.plant-button');
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.add('show');
            }, index * 150);
        });
    });
});