/**
 * 工具函数模块
 * 目前为空，可根据需要添加通用工具函数
 */

// 示例工具函数(未使用)
/**
 * 获取两个元素之间的距离
 * @param {number} x1 元素1的x坐标
 * @param {number} y1 元素1的y坐标
 * @param {number} x2 元素2的x坐标
 * @param {number} y2 元素2的y坐标
 * @returns {number} 两个元素之间的距离
 */
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}