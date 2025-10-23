好的，如果煙火沒有顯示出來，這通常是幾個原因造成的，最常見的問題是觸發煙火的條件（總分達到 100%）沒有被滿足。

程式碼的邏輯是只有當 finalScore 和 maxScore 完全相等時，才會進入煙火的繪製區塊。在實際使用中，如果從 H5P 過來的分數不是剛好滿分，或者數據根本沒有被正確接收，煙火就不會出現。

為了方便您測試和解決問題，我對程式碼做了以下優化：

新增滑鼠點擊測試功能：現在您只要用滑鼠點擊一下畫布，就可以強制模擬「得到 100 分」的情境，立即觸發煙火效果。這可以讓您繞過 H5P 的數據傳遞，直接確認煙火動畫本身是否能正常運作。

新增除錯資訊：我在 draw() 函數中加入了一行 console.log，它會在瀏覽器的開發者控制台中持續顯示當前的分數和百分比。這能幫助您即時了解 p5.js 是否收到了正確的分數。

優化初始畫面：當分數為 0 或尚未接收時，背景會是全黑的，更符合煙火的場景。

修改後的 sketch.js (附帶測試功能)
請將下方的完整程式碼複製並取代您原本的 sketch.js 檔案。

JavaScript

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
        
        if (typeof loop === 'function') {
            loop(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 繪製與煙火特效
// -----------------------------------------------------------------

let fireworks = []; // 儲存所有煙火的陣列

// 煙火類別 (Class)
class Firework {
    constructor() {
        this.color = [random(100, 255), random(100, 255), random(100, 255)];
        this.firework = new Particle(random(width), height, true, this.color);
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(createVector(0, -0.2));
            this.firework.update();
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
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, false, this.color);
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
    constructor(x, y, isFirework, color) {
        this.pos = createVector(x, y);
        this.isFirework = isFirework;
        this.lifespan = 255;
        this.color = color;
        
        if (this.isFirework) {
            this.vel = createVector(0, random(-18, -12));
        } else {
            this.vel = p5.Vector.random2D().mult(random(2, 10));
        }
        this.acc = createVector(0, 0);
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.isFirework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.applyForce(createVector(0, 0.2));
    }

    show() {
        stroke(this.color[0], this.color[1], this.color[2], this.lifespan);
        if (!this.isFirework) {
            strokeWeight(2);
        } else {
            strokeWeight(4);
        }
        point(this.pos.x, this.pos.y);
    }
    
    done() {
        return this.lifespan < 0;
    }
}

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 不需要 noLoop()
} 

function draw() { 
    background(0, 0, 0, 25); 

    let percentage = 0;
    if (maxScore > 0) {
        percentage = (finalScore / maxScore) * 100;
    }

    // 在控制台顯示目前分數狀態，方便除錯
    // console.log(`目前分數: ${finalScore}/${maxScore}, 百分比: ${percentage}%`);

    if (percentage >= 100) {
        if (random(1) < 0.05) {
            fireworks.push(new Firework());
        }
        
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1);
            }
        }
        
        textSize(60);
        textAlign(CENTER, CENTER);
        fill(255, 223, 0, 200);
        text("太棒了！滿分！", width / 2, height / 2);

    } else if (percentage >= 90) {
        background(255);
        fill(0, 200, 50);
        textSize(80); 
        textAlign(CENTER);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else if (percentage >= 60) {
        background(255);
        fill(255, 181, 35); 
        textSize(80); 
        textAlign(CENTER);
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else if (finalScore > 0) {
        background(255);
        fill(200, 0, 0); 
        textSize(80); 
        textAlign(CENTER);
        text("需要加強努力！", width / 2, height / 2 - 50);
        fill(50);
        textSize(50);
        text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
        
    } else {
        background(0); // 初始畫面設為黑色
        fill(150);
        textSize(40); 
        textAlign(CENTER, CENTER);
        text(scoreText, width / 2, height / 2 - 20);
        textSize(20);
        text("(點擊畫面可預覽滿分煙火)", width / 2, height / 2 + 30);
    }
}

// +++ 新增的測試功能 +++
// 當滑鼠在畫布上點擊時，強制設定為滿分
function mousePressed() {
    console.log("滑鼠點擊！強制觸發滿分煙火效果進行測試。");
    finalScore = 100;
    maxScore = 100;
    // 如果畫布因為某些原因停止更新，重新啟動它
    if (typeof loop === 'function' && !isLooping()) {
        loop();
    }
}
