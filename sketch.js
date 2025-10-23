// =================================================================
// 步驟一：成績數據接收與全域變數
// -----------------------------------------------------------------

let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 
let fireworks = []; 
let gravity;        
let showFireworks = false; 

// 監聽來自 H5P 內容的 postMessage
window.addEventListener('message', function (event) {
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // 呼叫重新繪製，強制 draw() 執行一次來處理新的分數
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js setup/draw 核心功能
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    
    noLoop(); 
    
    // 煙火設定
    gravity = createVector(0, 0.2); // 使用 createVector 確保 p5 函式可用
    colorMode(HSB); 
} 

function draw() { 
    
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // -----------------------------------------------------------------
    // C. 煙火和循環控制邏輯
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        showFireworks = true;
        loop(); 
        
        // 夜空背景 (半透明黑色，創造拖尾效果)
        background(0, 0, 0, 25); 
        
        // 隨機發射新的煙火 
        if (frameCount % 30 === 0 && random(1) < 0.05) {
            fireworks.push(new Firework());
        }
    } else {
        if (showFireworks) {
            background(255); 
            fireworks = []; 
            showFireworks = false;
        } else if (frameCount < 2) {
             background(255); 
        }
        
        noLoop(); 
    }

    // 更新和顯示所有煙火
    if (showFireworks) {
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1);
            }
        }
    }
    
    // -----------------------------------------------------------------
    // A. 繪製分數文本
    // -----------------------------------------------------------------
    
    colorMode(RGB); 
    textAlign(CENTER);
    
    // 繪製結果標語
    textSize(80); 
    if (percentage >= 90) {
        fill(0, 200, 50); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(150); 
        text("等待成績中...", width / 2, height / 2); 
    }

    // 繪製具體分數
    textSize(50);
    fill(showFireworks ? 255 : 50); 
    let scoreDisplay = (maxScore > 0) ? `${finalScore}/${maxScore}` : 'N/A';
    text(`得分: ${scoreDisplay}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 
    // -----------------------------------------------------------------
    if (!showFireworks) { 
        if (percentage >= 90) {
            fill(0, 200, 50, 150); 
            noStroke();
            circle(width / 2, height / 2 + 150, 150);
            
        } else if (percentage >= 60) {
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(width / 2, height / 2 + 150, 150, 150);
        }
    }
}


// =================================================================
// 步驟三：煙火和粒子系統的類別定義 (Function Constructor 模式)
// -----------------------------------------------------------------

// Particle 函式建構子
function Particle(x, y, hue, firework) {
    this.pos = createVector(x, y);
    this.firework = firework; 
    this.lifespan = 255;
    this.hu = hue;
    this.acc = createVector(0, 0);

    if (this.firework) {
        this.vel = createVector(0, random(-12, -8));
    } else {
        // 使用 p5.Vector.random2D() 確保 p5 函式可用
        this.vel = p5.Vector.random2D(); 
        this.vel.mult(random(0.5, 4));
    }
}

Particle.prototype.applyForce = function(force) {
    this.acc.add(force);
};

Particle.prototype.update = function() {
    if (!this.firework) {
        this.vel.mult(0.9);
        this.lifespan -= 4;
    }
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0); 
};

Particle.prototype.done = function() {
    return this.lifespan < 0;
};

Particle.prototype.show = function() {
    colorMode(HSB);
    if (!this.firework) {
        strokeWeight(2);
        stroke(this.hu, 255, 255, this.lifespan);
    } else {
        strokeWeight(4);
        stroke(this.hu, 255, 255);
    }
    point(this.pos.x, this.pos.y);
};


// Firework 函式建構子
function Firework() {
    this.hu = random(255); 
    this.firework = new Particle(random(width), height, this.hu, true);
    this.exploded = false;
    this.particles = [];
}

Firework.prototype.update = function() {
    if (!this.exploded) {
        this.firework.applyForce(gravity);
        this.firework.update();

        if (this.firework.vel.y >= 0) {
            this.exploded = true;
            this.explode();
        }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].applyForce(gravity);
        this.particles[i].update();
        if (this.particles[i].done()) {
            this.particles.splice(i, 1);
        }
    }
};

Firework.prototype.explode = function() {
    for (let i = 0; i < 100; i++) {
        let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
        this.particles.push(p);
    }
};

Firework.prototype.show = function() {
    if (!this.exploded) {
        this.firework.show();
    }

    for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].show();
    }
};

Firework.prototype.done = function() {
    return this.exploded && this.particles.length === 0;
};
