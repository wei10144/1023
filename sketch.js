// =================================================================
// 步驟一：成績數據接收與管理
// -----------------------------------------------------------------

// 使用一個物件來管理分數狀態，更清晰
let scoreData = {
    finalScore: 0,
    maxScore: 0,
    percentage: 0,
    isScoreReceived: false, // 追蹤是否已收到過分數
    scoreText: "等待成績中..."
};

window.addEventListener('message', function (event) {
    // 增加來源驗證，更安全 (可選，但建議)
    // if (event.origin !== "https://your-h5p-domain.com") {
    //     return;
    // }

    const data = event.data;
    
    // 檢查收到的資料結構是否完整
    if (data && data.type === 'H5P_SCORE_RESULT' && typeof data.score !== 'undefined' && typeof data.maxScore !== 'undefined') {
        
        console.log("成功接收到 H5P 分數資料:", data); 
        
        scoreData.finalScore = data.score;
        scoreData.maxScore = data.maxScore;
        scoreData.isScoreReceived = true;
        
        // 計算百分比
        if (scoreData.maxScore > 0) {
            scoreData.percentage = (scoreData.finalScore / scoreData.maxScore) * 100;
        } else {
            scoreData.percentage = 0;
        }

        scoreData.scoreText = `最終成績分數: ${scoreData.finalScore}/${scoreData.maxScore}`;

        // 確保 p5.js 的繪圖迴圈正在運行
        if (typeof loop === 'function' && !isLooping()) {
            loop();
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 繪製與煙火特效 (包含除錯功能)
// -----------------------------------------------------------------

let fireworks = []; // 儲存所有煙火的陣列

// 煙火和粒子的類別 (Class) 定義...
// (這部分程式碼與前次相同，保持不變)
class Firework {
    constructor() {
        this.color = [random(100, 255), random(100, 255), random(100, 255)];
        this.firework = new Particle(random(width), height, true, this.color);
        this.exploded = false;
        this.particles = [];
    }
    update() { if (!this.exploded) { this.firework.applyForce(createVector(0, -0.2)); this.firework.update(); if (this.firework.vel.y >= 0) { this.exploded = true; this.explode(); } } for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(); if (this.particles[i].done()) { this.particles.splice(i, 1); } } }
    explode() { for (let i = 0; i < 100; i++) { this.particles.push(new Particle(this.firework.pos.x, this.firework.pos.y, false, this.color)); } }
    show() { if (!this.exploded) { this.firework.show(); } for (let p of this.particles) { p.show(); } }
    done() { return this.exploded && this.particles.length === 0; }
}

class Particle {
    constructor(x, y, isFirework, color) {
        this.pos = createVector(x, y); this.isFirework = isFirework; this.lifespan = 255; this.color = color;
        if (this.isFirework) { this.vel = createVector(0, random(-18, -12)); } else { this.vel = p5.Vector.random2D().mult(random(2, 10)); }
        this.acc = createVector(0, 0);
    }
    applyForce(force) { this.acc.add(force); }
    update() { if (!this.isFirework) { this.vel.mult(0.9); this.lifespan -= 4; } this.vel.add(this.acc); this.pos.add(this.vel); this.acc.mult(0); this.applyForce(createVector(0, 0.2)); }
    show() { stroke(this.color[0], this.color[1], this.color[2], this.lifespan); if (!this.isFirework) { strokeWeight(2); } else { strokeWeight(4); } point(this.pos.x, this.pos.y); }
    done() { return this.lifespan < 0; }
}


function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2);
    // 強制啟動 draw() 循環，確保畫面能持續更新
    frameRate(60); 
    if (typeof loop === 'function' && !isLooping()) {
        loop();
    }
    
    // 在此印出除錯說明，打開瀏覽器開發者工具 (F12) 就能看到
    console.log("p5.js 畫布已準備就緒。");
    console.log("-----------------------------------------");
    console.log("除錯快捷鍵：");
    console.log("  按 '1' 鍵：模擬『滿分』(100/100)");
    console.log("  按 '2' 鍵：模擬『及格』(75/100)");
    console.log("  按 '3' 鍵：模擬『不及格』(40/100)");
    console.log("  按 '0' 鍵：模擬『重置/等待分數』狀態");
    console.log("-----------------------------------------");
}

function draw() {
    // 根據不同情境繪製背景
    if (scoreData.percentage >= 100) {
        background(0, 0, 0, 25); // 滿分時使用拖影效果
    } else if (scoreData.isScoreReceived) {
        background(255); // 收到分數但未滿分時，使用白色背景
    } else {
        background(0); // 等待分數時，使用黑色背景
    }

    // 繪製對應畫面
    if (scoreData.percentage >= 100) {
        // --- 滿分：顯示煙火 ---
        if (random(1) < 0.05) { fireworks.push(new Firework()); }
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) { fireworks.splice(i, 1); }
        }
        textSize(60); textAlign(CENTER, CENTER); fill(255, 223, 0, 200);
        text("太棒了！滿分！", width / 2, height / 2);

    } else if (scoreData.percentage >= 90) {
        drawScoreText("恭喜！優異成績！", color(0, 200, 50));
    } else if (scoreData.percentage >= 60) {
        drawScoreText("成績良好，請再接再厲。", color(255, 181, 35));
    } else if (scoreData.isScoreReceived) { // 只要收到分數但低於60
        drawScoreText("需要加強努力！", color(200, 0, 0));
    } else {
        // --- 初始畫面：等待分數 ---
        fill(150); textSize(40); textAlign(CENTER, CENTER);
        text(scoreData.scoreText, width / 2, height / 2 - 20);
        textSize(20);
        text("可按數字鍵 1, 2, 3 進行測試", width / 2, height / 2 + 30);
    }
}

// 輔助函數，避免重複的程式碼
function drawScoreText(message, textColor) {
    fill(textColor);
    textSize(80); 
    textAlign(CENTER, CENTER);
    text(message, width / 2, height / 2 - 50);
    
    fill(50);
    textSize(50);
    text(`得分: ${scoreData.finalScore}/${scoreData.maxScore}`, width / 2, height / 2 + 50);
}

// +++ 強大的除錯功能：鍵盤模擬分數 +++
function keyPressed() {
    console.log(`按下了按鍵：'${key}'`);
    scoreData.isScoreReceived = true; // 模擬已收到分數

    if (key === '1') { // 模擬滿分
        scoreData.finalScore = 100;
        scoreData.maxScore = 100;
    } else if (key === '2') { // 模擬及格
        scoreData.finalScore = 75;
        scoreData.maxScore = 100;
    } else if (key === '3') { // 模擬不及格
        scoreData.finalScore = 40;
        scoreData.maxScore = 100;
    } else if (key === '0') { // 模擬重置狀態
        scoreData.finalScore = 0;
        scoreData.maxScore = 0;
        scoreData.isScoreReceived = false;
        scoreData.scoreText = "等待成績中...";
        fireworks = []; // 清空煙火
    }
    
    // 手動更新百分比和文字
    if (scoreData.maxScore > 0) {
        scoreData.percentage = (scoreData.finalScore / scoreData.maxScore) * 100;
    } else {
        scoreData.percentage = 0;
    }
    scoreData.scoreText = `最終成績分數: ${scoreData.finalScore}/${scoreData.maxScore}`;

    // 確保畫面更新
    if (typeof loop === 'function' && !isLooping()) {
        loop();
    }
}
