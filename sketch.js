// =================================================================
// 步驟一：成績數據接收與全域變數
// -----------------------------------------------------------------

// 確保這是全域變數，用於儲存 H5P 傳來的分數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

// 監聽來自 H5P 內容的 postMessage
window.addEventListener('message', function (event) {
    // 這裡可以加入更嚴格的來源驗證 (event.origin)
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
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

let fireworks = []; // 儲存所有煙火物件的陣列
let gravity;        // 定義重力向量
let showFireworks = false; // 新增狀態變數來控制是否進入煙火模式

function setup() { 
    // 建立畫布，通常設定為頁面的一半大小以適應嵌入
    createCanvas(windowWidth / 2, windowHeight / 2); 
    
    // 初始背景設為白色
    background(255); 
    
    // 初始時停止循環，等待分數傳入
    noLoop(); 
    
    // 煙火設定
    gravity = createVector(0, 0.2); // 定義重力
    colorMode(HSB); // 使用 HSB 顏色模式方便隨機生成顏色
} 

function draw() { 
    
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // -----------------------------------------------------------------
    // C. 煙火和循環控制邏輯
    // -----------------------------------------------------------------
    
    // 判斷是否應該進入煙火模式
    if (percentage >= 90) {
        // 分數達標：進入煙火模式
        showFireworks = true;
        loop(); // 確保循環啟動
        
        // 設置夜空背景 (半透明黑色，創造拖尾效果)
        background(0, 0, 0, 25); 
        
        // 隨機發射新的煙火 (例如每 30 幀有 5% 的機會發射)
        if (frameCount % 30 === 0 && random(1) < 0.05) {
            fireworks.push(new Firework());
        }
    } else {
        // 分數未達標：退出煙火模式
        if (showFireworks) {
            // 只有在剛切換模式時才清空一次畫布和煙火陣列
            background(255); 
            fireworks = []; 
            showFireworks = false;
        } else if (frameCount < 2) {
            // 確保靜態模式下畫布是乾淨的白色
             background(255); 
        }
        
        // 停止循環
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
    
    colorMode(RGB); // 將文本顏色模式切回 RGB 以便使用常見的顏色值
    textAlign(CENTER);
    
    // 繪製結果標語
    textSize(80); 
    if (percentage >= 90) {
        fill(0, 200, 50); // 綠色 (在黑夜背景下依然清晰)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        fill(255, 181, 35); // 黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        fill(200, 0, 0); // 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        fill(150); // 灰色
        text("等待成績中...", width / 2, height / 2); 
    }

    // 繪製具體分數
    textSize(50);
    // 在煙火模式下使用白色文字，其他模式使用深色文字
    fill(showFireworks ? 255 : 50); 
    let scoreDisplay = (maxScore > 0) ? `${finalScore}/${maxScore}` : 'N/A';
    text(`得分: ${scoreDisplay}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (只有在非煙火模式/白天背景下繪製)
    // -----------------------------------------------------------------
    if (!showFireworks) { 
        if (percentage >= 90) {
            // 畫一個大圓圈代表完美 
            fill(0, 200, 50, 150); 
            noStroke();
            circle(width / 2, height / 2 + 150, 150);
            
        } else if (percentage >= 60) {
            // 畫一個方形 
            fill(255, 181, 35, 150);
            rectMode(CENTER);
            rect(width / 2, height / 2 + 150, 150, 150);
        }
    }
}


// =================================================================
// 步驟三：煙火和粒子系統的類別定義 (Firework & Particle)
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 255;
        this.hu = hue;
        this.acc = createVector(0, 0);

        if (this.firework) {
            this.vel = createVector(0, random(-12, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(0.5, 4));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); 
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            // 火花的顯示，顏色帶有透明度
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 煙火火箭的顯示
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
    }
}

class Firework {
    constructor() {
        this.hu = random(255); 
        this.firework = new Particle(random(width), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    update() {
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
    }

    explode() {
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }
}
