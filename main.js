const canvas = document.getElementById("circles");
const ctx = canvas.getContext('2d');

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


let xmin = -1;
let xmax = 2;
let ymid = 0.5;
let ymin, ymax;

function calculateY() {
    let yd = (xmax - xmin) / canvas.width * canvas.height / 2;
    ymin = ymid - yd;
    ymax = ymid + yd;
}

calculateY();

function CtoD(x, y) {
    return [(x - xmin) / (xmax - xmin) * canvas.width, (y - ymin) / (ymax - ymin) * canvas.height];
}

function DtoC(x, y) {
    return [x / canvas.width * (xmax - xmin) + xmin, y / canvas.height * (ymax - ymin) + ymin];
}

function aCtoDlength(l) {
    return l / (xmax - xmin) * canvas.width;
}

function aDtoClength(l) {
    return l / canvas.width * (xmax - xmin);
}

function drawCircle(x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
}

function dC(x, y, r) {
    drawCircle(...CtoD(x, y), aCtoDlength(r));
}

function dL(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(...CtoD(x1, y1));
    ctx.lineTo(...CtoD(x2, y2));
    ctx.stroke();
}

// https://stackoverflow.com/questions/17445231/js-how-to-find-the-greatest-common-divisor
function gcd(a,b) {
    a = Math.abs(a);
    b = Math.abs(b);
    if (b > a) {var temp = a; a = b; b = temp;}
    while (true) {
        if (b === 0) return a;
        a %= b;
        if (a === 0) return b;
        b %= a;
    }
}

const maxQVal = 2e9;

function renderCanvas() {
    calculateY();
    clearCanvas();

    dL(xmin, 0, xmax, 0);

    let minR = aDtoClength(0.5);
    let maxQ = Math.max(Math.ceil(Math.sqrt(0.5 / minR)), 2);


    function improveQBound(val) {
        if (maxQ > val)
            maxQ = val;
    }

    if (ymin > 0 || xmin > 1.5 || xmax < -0.5) {
        improveQBound(0); // Don't need to draw anything, it's out of the screen
    }

    if (ymax < 0) {
        improveQBound(Math.ceil(Math.sqrt(-1/ymax)));
    }

    improveQBound(maxQVal);
    ctx.font = "16px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "right";

    let text_d = aDtoClength(5);
    let circlesDrawn = 0;

    for (let q = 1; q < maxQ; q++) {
        let q_d = Math.sqrt(-ymin/q/q - ymin*ymin) * q;
        if (isNaN(q_d))
            q_d = .5 / q;
        let floorP = Math.max(Math.min(Math.ceil(q * xmax + q_d), q), 2);

        for (let p = Math.max(Math.ceil(q * xmin - q_d), 0); p < floorP; p++) {
            if (gcd(p, q) === 1) {
                let r = 1/2/q/q;
                dC(p/q, -r, r);

                circlesDrawn++;

                if (aCtoDlength(r) > 10) {
                    let textC = CtoD(p/q, text_d);

                    if (textC[0] < 0 || textC[0] > canvas.width || textC[1] < 0 || textC[1] > canvas.height)
                        continue;

                    ctx.save();
                    ctx.translate(...textC);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(p + '/' + q, 0, 0);
                    ctx.restore();
                }
            }
        }
    }

    console.log(circlesDrawn);
}

renderCanvas();

let mouseDown = false;
let fix_x, fix_y;
let c;

function onMouseDown(evt) {
    mouseDown = true;
    [fix_x, fix_y] = DtoC(evt.clientX, evt.clientY);
}

function onMouseMove(evt) {
    if (mouseDown) {
        let x = evt.clientX, y = evt.clientY;

        let xd = xmax-xmin;
        xmin = fix_x - x / canvas.width * xd;
        xmax = xmin + xd;

        let yd = ymax-ymin;
        ymin = fix_y - y / canvas.height * yd;
        ymid = ymin + yd/2;

        renderCanvas();
    }
}

function onMouseUp(evt) {
    mouseDown = false;
}

function onScroll(evt) {
    let z = 1 + evt.deltaY / 500;
    let x = evt.clientX, y = evt.clientY;

    let [f_x, f_y] = DtoC(x, y);

    let xd = xmax - xmin;
    let new_xd = xd * z;

    xmin = f_x - x / canvas.width * new_xd;
    xmax = xmin + new_xd;

    let yd = ymax - ymin;
    let new_yd = yd * z;
    ymid = f_y - y / canvas.height * new_yd + new_yd / 2;

    renderCanvas();
}

[
    ["mousedown", onMouseDown],
    ["mousemove", onMouseMove],
    ["mouseup", onMouseUp],
    ["mousewheel", onScroll]
].forEach(arr => window.addEventListener(...arr));


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    renderCanvas();
}

setTimeout(resizeCanvas, 100);

window.addEventListener("resize", resizeCanvas);