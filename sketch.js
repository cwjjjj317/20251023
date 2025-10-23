// =================================================================
// 步驟三：煙火和粒子系統的類別定義
// -----------------------------------------------------------------

let fireworks = []; // 儲存所有煙火物件的陣列
let gravity;        // 定義重力向量

class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否為向上發射的煙火 (true) 還是爆炸後的火花 (false)
        this.lifespan = 255;
        this.hu = hue;
        this.acc = createVector(0, 0);

        if (this.firework) {
            // 向上發射的煙火
            this.vel = createVector(0, random(-12, -8));
        } else {
            // 爆炸後的火花，隨機方向
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(0.5, 4));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 爆炸後的火花會逐漸減速和消失
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重設加速度
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            // 火花的顯示
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
        // 煙火從畫布底部發射
        this.hu = random(255); // 隨機顏色
        this.firework = new Particle(random(width), height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            // 檢查煙火是否達到最高點（速度變為正或接近零）
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
        // 產生多個爆炸火花
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
        // 煙火結束的條件：火箭已爆炸且所有火花都已消失
        return this.exploded && this.particles.length === 0;
    }
}
