// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js"; // Import the Realtime Database module
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const videoElement = document.getElementsByClassName('input_video')[0];
videoElement.style.transform = 'scale(-1, 1)';
const canvasElement = document.getElementsByClassName('output_canvas')[0];
canvasElement.style.transform = 'scale(-1, 1)';
const canvasCtx = canvasElement.getContext('2d');
const hp_div = document.getElementsByClassName('hp')[0];
const combo_div = document.getElementsByClassName('combo')[0];
const success_rate_div = document.getElementsByClassName('success_rate')[0];
const total_score_div = document.getElementsByClassName('total_score')[0];
const level_div = document.getElementsByClassName('level')[0];
const leader_board_div = document.getElementsByClassName('leader_board')[0];
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBTkOOTxxEf2j3VoQRsiM7R0gGjhmyRyhA",
    authDomain: "boxing-febc2.firebaseapp.com",
    databaseURL: "https://boxing-febc2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "boxing-febc2",
    storageBucket: "boxing-febc2.appspot.com",
    messagingSenderId: "938023205097",
    appId: "1:938023205097:web:513099ec33af56ba935878",
    measurementId: "G-WC0MXTNCL8"
};
// Initialize Firebase and its vaiable
const app = initializeApp(firebaseConfig);
const database = getDatabase(); // Get a reference to the database
let leaderBoard_Firebase = [];

let current_level = 0;
let boxing_pattern = [];
let check = [];

let previousTime = Date.now();
let currentTime;
let last_time_level;
let deltaTime;
let timer = 0;
let spawn_timer = 0;
let canStart = false;
let gameOver = false;

let startButtonTime = 2;//let bufferTime = 7;  //give buffer when the game starts
let fightback_touch = false;

const start_img = new Image();
start_img.src = 'start button.png';
const startObj = {
    x: 550,
    y: 80,
    width: 100,
    height: 100,
    visibility: 1,
    coordSys: "MPpixel",
}

if ("serviceWorker" in navigator) {
    window.addEventListener("load", function() {
      navigator.serviceWorker
        .register("/serviceWorker.js")
        .then(res => console.log("service worker registered"))
        .catch(err => console.log("service worker not registered", err))
    })
  }

function onResults(results) {
    if (!results.poseLandmarks) {
        //grid.updateLandmarks([]);
        return;
    }
    // console.log("scoreTracker");
    // console.log(scoreTracker);
    //console.log(results.poseLandmarks[19].z - results.poseLandmarks[11].z);

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // const leftHandObj = {
    //     x: results.poseLandmarks[19].x * canvasElement.width,
    //     y: results.poseLandmarks[19].y * canvasElement.height,
    //     width: 10,
    //     height: 10,
    //     visibility: results.poseLandmarks[19].visibility,
    //     coordSys: "MPpixel",
    // };
    // const rightHandObj = {
    //     x: results.poseLandmarks[20].x * canvasElement.width,
    //     y: results.poseLandmarks[20].y * canvasElement.height,
    //     width: 10,
    //     height: 10,
    //     visibility: results.poseLandmarks[20].visibility,
    //     coordSys: "MPpixel",
    // };

    //change all lankmarks into objects
    let allBodyInfo = [];
    for (let data of results.poseLandmarks) {
        let landmark = new landmarkToObject(data.x * canvasElement.width, data.y * canvasElement.height, data.z * 100, 20, 20, data.visibility, data.coordSys);
        allBodyInfo.push(landmark);
    }

    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.globalCompositeOperation = 'source-over';
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });

    //left hand
    canvasCtx.fillStyle = "black";
    canvasCtx.fillRect(allBodyInfo[19].x, allBodyInfo[19].y, allBodyInfo[19].width - 10, allBodyInfo[19].height - 10);
    //right hand
    canvasCtx.fillStyle = "blue";
    canvasCtx.fillRect(allBodyInfo[20].x, allBodyInfo[20].y, allBodyInfo[20].width - 10, allBodyInfo[20].height - 10);
    if (!canStart) {
        start_button(allBodyInfo);
    }
    canvasCtx.globalCompositeOperation = 'destination-over';
    canvasCtx.restore();
    //grid.updateLandmarks(results.poseWorldLandmarks);

    //count time
    currentTime = Date.now();
    deltaTime = (currentTime - previousTime) / 1000; // divide by 1000 to convert milliseconds to seconds
    // timer += deltaTime;

    // console.log(canStart);

    if (canStart) {

        if (!canSpawn) {
            // update boxing pattern array
            //test
            // if (current_level == 1) {
            //     boxing_pattern = [];//test faster
            // }
            if (boxing_pattern.length == 0 || score.hp <= 0) {
                // if (current_level == 1 || score.hp <= 0) {
                if (current_level == 10 || score.hp <= 0) {
                    // console.log("GAMEOVER");
                    gameOver = true;
                    //update leader board in firebase
                    updateLeaderBoard();
                    //reset variable
                    resetGame();
                    //show the leader board to player
                    level_div.innerHTML = 'level: ' + last_time_level;
                    //show leader board in the div
                    // set_Score_Firebase();
                    // return;
                }


                current_level += 1;
                console.log('level', current_level);
                if (!gameOver) {
                    level_div.innerHTML = 'level: ' + current_level;
                }


                // define punch and fight back ratio
                let weights = [fbRate[current_level], 1 - fbRate[current_level]];
                let distribution = createDistribution(weights, 10);
                for (let i = 0; i < count[current_level]; i++) {
                    // array to store boxiing pattern
                    boxing_pattern.push(randomItem(array, distribution));
                }
            }
            // console.log(boxing_pattern);
            check.push(boxing_pattern[0]);
            // console.log(check);
            canSpawn = true;
        }
        else {
            spawn_timer += deltaTime;
            if (check[0] == 'punch' && spawn_timer >= spawnTime[current_level]) {
                //spawn bubble
                obstacle.spawnBubble();
                timer += deltaTime;

                //calculate difference
                obstacle.bubble.right_hand_diff_z = Math.abs(allBodyInfo[20].z - obstacle.bubble.last_right_hand_pos.z);
                obstacle.bubble.left_hand_diff_z = Math.abs(allBodyInfo[19].z - obstacle.bubble.last_left_hand_pos.z);
                obstacle.bubble.right_hand_diff_x = Math.abs(allBodyInfo[20].x - obstacle.bubble.last_right_hand_pos.x);
                obstacle.bubble.left_hand_diff_x = Math.abs(allBodyInfo[19].x - obstacle.bubble.last_left_hand_pos.x);
                obstacle.bubble.right_hand_diff_y = Math.abs(allBodyInfo[20].y - obstacle.bubble.last_right_hand_pos.y);
                obstacle.bubble.left_hand_diff_y = Math.abs(allBodyInfo[19].y - obstacle.bubble.last_left_hand_pos.y);

                // to detect whether the bubble is touched
                if (timer >= 0.7) { //avoid detect so quickly when the last hand move back
                    //直拳
                    if (obstacle.bubble.color == "red") {
                        //spawn right
                        if (obstacle.bubble.isRight) {
                            if (obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z || obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.miss();
                            }
                        }
                        //spawn left
                        else {
                            if (obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z || obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.miss();
                            }
                        }
                    }

                    //左/右勾拳
                    else if (obstacle.bubble.color == "green") {
                        if (!obstacle.bubble.isRight) {
                            // console.log("bubble is poped")
                            if (obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z * 2 || obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z * 2 || obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.miss();
                            }
                        }
                        else {
                            if (obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z * 2 || obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z * 2 || obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.miss();
                            }
                        }
                    }

                    //上鉤拳
                    else if (obstacle.bubble.color == "blue") {
                        if (obstacle.bubble.isRight) {
                            // console.log("bubble is poped")
                            if (obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z*2 || obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z*2) {
                                obstacle.bubble.miss();
                            }
                        }
                        else {
                            if (obstacle.bubble.left_hand_diff_y >= obstacle.bubble.threshold_y) {
                                obstacle.bubble.success();
                            }
                            else if (obstacle.bubble.right_hand_diff_y >= obstacle.bubble.threshold_y || obstacle.bubble.left_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.right_hand_diff_x >= obstacle.bubble.threshold_x || obstacle.bubble.left_hand_diff_z >= obstacle.bubble.threshold_z*2 || obstacle.bubble.right_hand_diff_z >= obstacle.bubble.threshold_z*2) {
                                obstacle.bubble.miss();
                            }
                        }
                    }
                }
                //die if cant hit in time
                if (timer >= lifeTime[current_level]) {
                    obstacle.bubble.isPop = true;
                    score.miss();
                    reset_variable();
                    console.log("Miss")
                }
            }

            else if (check[0] == 'fightback' && spawn_timer >= spawnTime[current_level]) {
                obstacle.spawnBar();
                timer += deltaTime;
                //to detect whether the bar is touched every 3 seconds
                if (timer >= (fbTime[current_level])) {
                    for (let bodyObj of allBodyInfo) {
                        if (detectCollision(bodyObj, obstacle.bar.obj)) {
                            score.miss();
                            score.hp--;
                            hp_div.innerHTML = 'hp: ' + score.hp;
                            // console.log("touched");
                            fightback_touch = true;
                            break;
                        }
                    }
                    if (!fightback_touch) {
                        score.add();
                    }
                    fightback_touch = false;
                    // if (detectCollision(rightHandObj, barObj) || detectCollision(leftHandObj, barObj)) {
                    //     console.log("touched");
                    // }
                    obstacle.bar.isPop = true;
                    reset_variable();

                }
            }
        }
    }

    //update the past time
    previousTime = currentTime;
    obstacle.bubble.last_right_hand_pos = allBodyInfo[20];
    obstacle.bubble.last_left_hand_pos = allBodyInfo[19];
}


const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});
pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({ image: videoElement });
    },
    width: 1280,
    height: 720
});
camera.start();

function detectCollision(obj1, obj2) {
    const rect1 = {
        x: obj1.x,
        y: obj1.y,
        width: obj1.width,
        height: obj1.height,
    };

    const rect2 = {
        x: obj2.x,
        y: obj2.y,
        width: obj2.width,
        height: obj2.height,
    };

    if (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    ) {
        return true;
    }

    return false;
}

function reset_variable() {
    timer = 0;
    check = [];
    boxing_pattern.shift();
    canSpawn = false;
    spawn_timer = 0;
}

const createDistribution = (weights, size) => {
    const distribution = [];
    for (let i = 0; i < weights.length; i++) {
        const limit = size * weights[i];
        for (let j = 0; j < limit; j++) {
            distribution.push(i);
        }
    }
    return distribution;
}

const randomIndex = (distribution) => {
    const index = Math.floor(distribution.length * Math.random());
    return distribution[index];
}

const randomItem = (array, distribution) => {
    const index = randomIndex(distribution);
    return array[index];
}

let array = ['fightback', 'punch'];
// let weights = [0.15, 0.85];
// let distribution = createDistribution(weights, 10);


// const distribution = createDistribution(weights, 10);

// for (let i = 0; i < 10; i++) {
//     console.log(randomItem(array, distribution));
// }

let spawnTime = [];
let lifeTime = [];
let fbRate = [];
let fbTime = [];
let count = [];
fetch('training_level_data.xlsx')
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets['Sheet1'];

        for (let i = 1; i <= 11; i++) {
            //const levelCell = worksheet[`A${i}`];
            const spawnTimeCell = worksheet[`B${i}`];
            const lifeTimeCell = worksheet[`C${i}`];
            const fbRateCell = worksheet[`D${i}`];
            const fbTimeCell = worksheet[`E${i}`];
            const countCell = worksheet[`F${i}`];

            if (spawnTimeCell && lifeTimeCell && fbRateCell && fbTimeCell) { //levelCell &&
                //levels.push(levelCell.v);
                spawnTime.push(spawnTimeCell.v);
                lifeTime.push(lifeTimeCell.v);
                fbRate.push(fbRateCell.v);
                fbTime.push(fbTimeCell.v);
                count.push(countCell.v);
            }
        }
        // console.log(levels);
        // console.log(spawnTime);
        // console.log(lifeTime);
        // console.log(fbRate);
        // console.log(fbTime);
        // console.log(count);
    })
    .catch(error => {
        //console.error('Error reading Excel file:', error);
    });


let canSpawn = false;

class BubbleBarGame {
    constructor() {
        this.bubble = {
            x: 0,
            // y: 0,
            x_pos: [160, 480],
            y: 120,
            size: 30,
            isPop: true,
            diff_X_left: 0,
            diff_X_right: 0,
            diff_Y_left: 0,
            diff_Y_right: 0,
            disWithHand_x: 50,
            disWithHand_y: 20,
            isRight: true,
            colors: ["red", "blue", "green"],
            color: "",
            last_left_hand_pos: 0,
            last_right_hand_pos: 0,
            left_hand_diff_z: 0,
            right_hand_diff_z: 0,
            left_hand_diff_x: 0,
            right_hand_diff_x: 0,
            left_hand_diff_y: 0,
            right_hand_diff_y: 0,
            threshold_x: 30,
            threshold_y: 30,
            threshold_z: 10,
            obj: {
                x: 0,
                y: 0,
                width: 30,
                height: 30,
                visibility: 1,
                coordSys: "MPpixel"
            },
            success() {
                obstacle.bubble.isPop = true;
                score.add();
                reset_variable();
                console.log("Success")
            },
            miss() {
                obstacle.bubble.isPop = true;
                score.miss();
                reset_variable();
                console.log("Miss")
            }
        };

        this.bar = {
            Pos: [
                { x: 320, y: 0, width: 320, height: 360 },
                { x: 0, y: 0, width: 320, height: 360 },
                { x: 0, y: 0, width: 640, height: 180 }
            ],
            ran_num: Math.floor(Math.random() * 3),
            isPop: true,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            obj: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                visibility: 1,
                coordSys: "MPpixel"
            },
            last_ran_num: 10
        };
    }

    spawnBubble() {
        if (canSpawn) {
            if (this.bubble.isPop) {
                //change spawn position
                obstacle.reroll();
                //set hitbox
                this.bubble.obj.x = this.bubble.x;
                this.bubble.obj.y = this.bubble.y;
                this.bubble.isPop = false;
            }
            canvasCtx.fillStyle = obstacle.bubble.color;
            canvasCtx.beginPath();
            canvasCtx.arc(this.bubble.x, this.bubble.y, this.bubble.size, 0, Math.PI * 2);
            canvasCtx.fill();
            canvasCtx.stroke();
        }
    }

    spawnBar() {
        if (canSpawn) {
            if (this.bar.isPop) {
                while (this.bar.ran_num === this.bar.last_ran_num) {
                    this.bar.ran_num = Math.floor(Math.random() * 3);
                }
                this.bar.x = this.bar.Pos[this.bar.ran_num].x;
                this.bar.y = this.bar.Pos[this.bar.ran_num].y;
                this.bar.width = this.bar.Pos[this.bar.ran_num].width;
                this.bar.height = this.bar.Pos[this.bar.ran_num].height;
                this.bar.obj.x = this.bar.x;
                this.bar.obj.y = this.bar.y;
                this.bar.obj.width = this.bar.width;
                this.bar.obj.height = this.bar.height;
                this.bar.isPop = false;
                this.bar.last_ran_num = this.bar.ran_num;
                // console.log("Bar");
                // console.log(this.bar.obj);
            }
            canvasCtx.fillStyle = 'blue';
            canvasCtx.fillRect(this.bar.x, this.bar.y, this.bar.width, this.bar.height);
        }
    }

    // reroll(leftHand, rightHand) {
    //     this.bubble.x = Math.random() * 320 + 160;
    //     this.bubble.y = Math.random() * 180;
    //     this.bubble.diff_X_left = Math.abs(leftHand.x - this.bubble.x);
    //     this.bubble.diff_X_right = Math.abs(rightHand.x - this.bubble.x);
    //     this.bubble.diff_Y_left = Math.abs(leftHand.y - this.bubble.y);
    //     this.bubble.diff_Y_right = Math.abs(rightHand.y - this.bubble.y);
    //     while (
    //         this.bubble.diff_X_left <= this.bubble.disWithHand_x ||
    //         this.bubble.diff_X_right <= this.bubble.disWithHand_x
    //     ) {
    //         this.bubble.x = Math.random() * (320) + 160;
    //         this.bubble.diff_X_left = Math.abs(leftHand.x - this.bubble.x);
    //         this.bubble.diff_X_right = Math.abs(rightHand.x - this.bubble.x);
    //     }

    //     while (
    //         this.bubble.diff_Y_left <= this.bubble.disWithHand_y ||
    //         this.bubble.diff_Y_right <= this.bubble.disWithHand_y
    //     ) {
    //         this.bubble.y = Math.random() * 180;
    //         this.bubble.diff_Y_left = Math.abs(leftHand.y - this.bubble.y);
    //         this.bubble.diff_Y_right = Math.abs(rightHand.y - this.bubble.y);
    //     }
    // }
    reroll() {
        //reroll left and right
        this.bubble.x = this.bubble.x_pos[Math.round(Math.random())];
        if (this.bubble.x == 160) {
            this.bubble.isRight = true
        }
        else { this.bubble.isRight = false }

        //reroll color
        let randomIndex = Math.floor(Math.random() * 3);
        obstacle.bubble.color = obstacle.bubble.colors[randomIndex];
    }
}
const obstacle = new BubbleBarGame();

function start_button(objects) {
    canvasCtx.drawImage(start_img, 550, 80, 100, 100);
    if (detectCollision(startObj, objects[20]) || detectCollision(startObj, objects[19])) {
        timer += deltaTime;
        hp_div.innerHTML = 'hp: ' + score.hp;
        if (timer >= startButtonTime) {
            //change variable to start game
            gameOver = false;
            canStart = true;
            timer = 0;
            level_div.innerHTML = 'level: ' + current_level;
            //read from firebase
            firebaseUse.read_Score()
                .then((leaderboard) => {
                    leaderBoard_Firebase = leaderboard;
                    console.log("data in server:")
                    console.log(leaderBoard_Firebase); // The leaderboard data read from Firebase will be stored in the 'leaderBoard_Firebase' variable
                })
        }
    }
}

function updateLeaderBoard() {
    //test
    // score_setting.total_score = 7000;

    //to prevent the leader board from showing null
    if (score.total_score == null) {
        score.total_score = 0;
    }
    //set leader board
    scoreTracker.setTop10Scores(leaderBoard_Firebase);

    //add the lastest score(int) to the leaderboard array 
    scoreTracker.addScore(Math.round((score.total_score)));
    console.log("data added:")
    console.log(scoreTracker.allScores);
    //clear the array to free the space for the local memory and make sure the array only contains 10 numbers
    scoreTracker.clearScores();
    firebaseUse.write_Score();
}

function resetGame() {
    canStart = false;
    last_time_level = current_level;
    current_level = 0;
    score.current_combo = 0;
    score.hit = 0;
    score.full_hit = 0;
    score.total_score = 0;
    score.success_rate = 0;
    score.hp = 3;
    leader_board_div.innerHTML = scoreTracker.convertTop10ScoresToText(scoreTracker.allScores);
}

class landmarkToObject {
    constructor(x, y, z, width, height, visibility, coordSys) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.width = width;
        this.height = height;
        this.visibility = visibility;
        this.coordSys = coordSys;
    }
}

class score_setting {
    constructor() {
        this.current_combo = 0;
        this.hit = 0;
        this.full_hit = 0;
        this.total_score = 0;
        this.success_rate = 0;
        this.hp = 3;
        // this.hp = 300;
    }

    add() {
        this.current_combo += 1;
        this.hit += 1;
        this.full_hit += 1;
        combo_div.innerHTML = 'Combo: ' + this.current_combo;
        this.success_rate = this.hit / this.full_hit;
        success_rate_div.innerHTML = this.hit + ' / ' + this.full_hit + ' success rate: ' + this.success_rate.toFixed(2);
        this.total_score += current_level * this.success_rate.toFixed(2) * this.current_combo;
        total_score_div.innerHTML = 'Score: ' + Math.round(this.total_score);
    }

    miss() {
        this.current_combo = 0;
        this.full_hit += 1;
        combo_div.innerHTML = 'Combo: ' + this.current_combo;
        this.success_rate = this.hit / this.full_hit;
        success_rate_div.innerHTML = this.hit + ' / ' + this.full_hit + ' success rate: ' + this.success_rate.toFixed(2);
    }
}

const score = new score_setting();
combo_div.innerHTML = 'Combo: ' + score.current_combo;
total_score_div.innerHTML = 'Score: ' + score.total_score;
success_rate_div.innerHTML = score.hit + ' / ' + score.full_hit + ' success rate: ' + score.success_rate;
hp_div.innerHTML = 'hp: ' + score.hp;

//help manage the leader board
class ScoreTracker {
    constructor() {
        this.allScores = [];
    }

    setTop10Scores(scores) {
        this.allScores = scores;
    }

    addScore(score) {
        this.allScores.push({ score: score, level: current_level });
        this.allScores = this.getTop10Scores_Descending();
    }

    getTop10Scores_Descending() {
        return this.allScores.slice().sort((a, b) => b.score - a.score);
    }

    clearScores() {
        // this.allScores = [];
        while (this.allScores.length > 10) {
            this.allScores = this.getTop10Scores_Descending();
            this.allScores = this.allScores.slice(0, -1);
        }
    }

    convertTop10ScoresToText(top10Scores) {
        let text = "Leader board: <br>";
        top10Scores.forEach((score, index) => {
            text += `${index + 1}. Score: ${score.score}, Level: ${score.level}<br>`;
        });
        return text;
    }
}
const scoreTracker = new ScoreTracker();

class Firebase {
    constructor() {
        this.arrayRef = ref(database, "myArrayData");
    }

    async read_Score() {
        try {
            const snapshot = await get(this.arrayRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const leaderboard = Object.values(data).map((entry) => ({
                    level: entry.level,
                    score: entry.score,
                }));
                return leaderboard;
            }
        } catch (error) {
            console.error("Error reading leaderboard from Firebase:", error);
        }
        return []; // Return an empty array if there was an error or the data doesn't exist
    }

    write_Score() {
        set(this.arrayRef, scoreTracker.allScores)
            .then(() => {
                console.log("Array uploaded successfully!");
            })
            .catch((error) => {
                console.error("Error uploading array:", error);
            });
    }
}

const firebaseUse = new Firebase();

