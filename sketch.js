// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------
let finalScore = 0;
let maxScore = 0;
let scoreText = "等待成績中..."; // 初始提示文字

window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        finalScore = data.score;
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 當收到新分數時，重新觸發繪製循環
        if (typeof loop === 'function') {
            loop(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 繪製與煙火特效
// -----------------------------------------------------------------

let fireworks = []; // 儲存所有煙火的陣列
let particles = []; // 儲存所有爆炸粒子的陣列

// 煙火類別 (Class)
class Firework {
    constructor() {
        // 從底部中央往上發射
        this.firework = new Particle(random(width), height, true);
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, -0.2)); // 模擬上升力
            this.firework.update();
            // 當煙火速度變為向上時引爆 (到達頂點)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 產生 100 個爆炸粒子
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        for (let p of this.particles) {
            p.show();
        }
    }
    
    done() {
        return this.exploded && this.particles.length === 0;
    }
}

// 粒子類別 (可用於煙火彈或爆炸後的火花)
class Particle {
    constructor(x, y, isFirework) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework;
        this.lifespan = 255; // 生命週期，用於淡出效果
        
        if (this.isFirework) {
            // 煙火彈的初始速度
            this.vel = createVector(0, random(-18, -12));
        } else {
            // 爆炸粒子的速度
            this.vel = p5.Vector.random2D().mult(random(2, 10));
        }
        this.acc = createVector(0, 0); // 加速度
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.9); // 模擬空氣阻力
            this.lifespan -= 4; // 生命週期衰減
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
        // 模擬重力
        this.applyForce(createVector(0, 0.2));
    }

    show() {
        if (!this.isFirework) {
            strokeWeight(2);
            stroke(random(100, 255), random(100, 255), random(100, 255), this.lifespan);
        } else {
            strokeWeight(4);
            stroke(255, 255, 0); // 上升的火光
        }
        point(this.pos.x, this.pos.y);
    }
    
    done() {
        return this.lifespan < 0;
    }
}


function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(0); 
    // 移除 noLoop() 以啟用動畫
} 

function draw() { 
    // 使用帶有透明度的黑色背景，創造拖影效果
    background(0, 0, 0, 25); 

    let percentage = 0;
    if (maxScore > 0) {
        percentage = (finalScore / maxScore) * 100;
    }

    // -----------------------------------------------------------------
    // 根據分數顯示不同內容
    // -----------------------------------------------------------------
    if (percentage >= 100) {
        // 全對時，觸發煙火特效
        if (random(1) < 0.05) { // 控制煙火生成頻率
            fireworks.push(new Firework());
        }
        
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1);
            }
        }
        
        // 可以在煙火背景上顯示祝賀語
        textSize(60);
        textAlign(CENTER, CENTER);
        fill(255, 223, 0, 200); // 金色
        text("太棒了！滿分！", width / 2, height / 2);

    } else if (percentage >= 90) {
        fill(0, 200, 50);
        textSize(80); 
        textAlign(CENTER);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); 
        textSize(80); 
        textAlign(CENTER);
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else if (percentage > 0) {
        fill(200, 0, 0); 
        textSize(80); 
        textAlign(CENTER);
        text("需要加強努力！", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        textSize(50); 
        textAlign(CENTER, CENTER);
        text(scoreText, width / 2, height / 2);
    }
    
    // 清理舊粒子 (如果需要)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].show();
        if (particles[i].done()) {
            particles.splice(i, 1);
        }
    }
}
