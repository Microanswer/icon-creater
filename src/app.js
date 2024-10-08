const SpriteItemTemplateDom = document.querySelector("#sprite-item-template");
const RectSvgDom = document.querySelector("#rect-svg");
const ImgSvgDom = document.querySelector("#img-svg");
const TxtSvgDom = document.querySelector("#txt-svg");
const CfgFileSelectorDom = document.querySelector("#cfg-file-selector");

const spriteWrapDom = document.querySelector("#spriteWrap");
const spriteEmptyDom = document.querySelector("#spriteEmpty");
const rectSpriteOptionWrapDom = document.querySelector("#rectSpriteOptionWrap");
const imgSpriteOptionWrapDom = document.querySelector("#imgSpriteOptionWrap");
const spriteOptionEmptyDom = document.querySelector("#spriteOptionEmpty");

const acModalTitleDom = ac_modal.querySelector(".ac_modal-title");
const acModalMsgDom = ac_modal.querySelector(".ac_modal-msg");
const acModalConfirmBtn = ac_modal.querySelector(".ac_modal-confirm");


const canvasWrap = document.getElementById('canvas-wrap');

let spriteDoms = [];
let currentSpriteDom = null;
let currentSpriteOptionDom = null;
let currentSprite = null;

let canvas = null;
/**
 * @type {CanvasRenderingContext2D}
 */
let globalContext = null;
let width = 0;
let height = 0;
let drawOption = {
    title: "新图标",
    gridCount: 30,
    sprits: [

    ]
};

function newSpritsDemoCfg() {
    return {
        title: "新图标",
        sprits: [
            {
                title: "主体背景白色",
                spritType: "rect",
                x: 0.5,
                y: 0.5,
                size: 0.9,
                radio: 0.25,
                type: "g1",
                shadowX: 0,
                shadowY: 0,
                shadowColor: "#6e6e6e",
                shadowBlur: 18,
                bg: "#FFFFFF"
            },
            {
                title: "主体前景图片",
                spritType: "img",
                x: 0.5,
                y: 0.5,
                size: 0.6,
                img: "",
                shadowX: 0,
                shadowY: 0,
                shadowColor: "#000000",
                shadowBlur: 0,
            }
        ]
    }
}

window.onresize = function () {
    resizeCanvas();
    draw();
}

function initCanvas() {
    canvas = document.createElement("canvas");
    canvas.addEventListener("click", onCanvasClick);
    canvas.classList.add("w-full");
    globalContext = canvas.getContext("2d");
    canvasWrap.append(canvas);
    resizeCanvas();
}

function resizeCanvas() {
    canvas.width = canvasWrap.clientWidth * devicePixelRatio;
    canvas.height = canvasWrap.clientHeight * devicePixelRatio;
    width = canvas.width;
    height = canvas.height;
}

function getSpritBound(sprite, contextWidth, contextHeight) {
    const w = sprite.size * contextWidth;
    const h = sprite.size * contextHeight;
    const x = sprite.x * contextWidth - w / 2;
    const y = sprite.y * contextHeight - h / 2;
    return {x: x, y: y, w: w, h: h};
}

function applyShadow(context, offsetX, offsetY, color, blur) {
    context.shadowColor = color;
    context.shadowOffsetX = offsetX;
    context.shadowOffsetY = offsetY;
    context.shadowBlur = blur;
}

function clearShadow(context) {
    context.shadowColor = "transparent";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;
}

/**
 *
 * @param gridCount {number}
 */
function drawBG(context, contextWidth, contextHeight, gridCount) {
    const oriBG = context.fillStyle;
    clearShadow(context);
    context.fillStyle = "#f2f2f2";
    context.fillRect(0, 0, contextWidth, contextHeight);
    context.fillStyle = oriBG;

    const oriColor = context.strokeStyle;
    context.strokeStyle = "#cecece";
    const gridRowSpace = contextHeight / gridCount;
    const gridColSpace = contextWidth / gridCount;

    const oriStrokeWidth = context.lineWidth;

    context.lineWidth = 0.5;
    context.beginPath();

    let rowLineX1 = 0, rowLineY1 = 0, rowLineX2 = contextWidth, rowLineY2 = 0;
    let colLineX1 = 0, colLineY1 = 0, colLineX2 = 0, colLineY2 = contextHeight;
    for (let i = 0; i < gridCount + 1/* 补上最右边和最下边的 */; i++) {
        context.moveTo(rowLineX1, rowLineY1); context.lineTo(rowLineX2, rowLineY2);
        context.moveTo(colLineX1, colLineY1); context.lineTo(colLineX2, colLineY2);

        rowLineY1 += gridRowSpace; rowLineY2 += gridRowSpace;
        colLineX1 += gridColSpace; colLineX2 += gridColSpace;
    }

    context.closePath();
    context.stroke();
    context.lineWidth = oriStrokeWidth;

    context.strokeStyle = oriColor;
}

function drawImg(context, contextWidth, contextHeight, option) {
    let {x, y, w, h} = getSpritBound(option, contextWidth, contextHeight);

    // 没有指定图片，那么将svg图标绘制进去
    let imgObj = option.drawImg || {img: new Image(), loaded: false};
    option.drawImg = imgObj;
    if (!imgObj.loaded) {
        imgObj.img.onload = function () {
            imgObj.loaded = true;
            applyShadow(context, (option.shadowX || 0) * w, (option.shadowY || 0) * h, option.shadowColor, option.shadowBlur);
            context.drawImage(imgObj.img, x, y, w, h);
            clearShadow(context);
        }

        if (!option.img) {
            imgObj.img.src = 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(ImgSvgDom));
        } else {
            imgObj.img.src = option.img;
        }
    } else {
        applyShadow(context, (option.shadowX || 0) * w, (option.shadowY || 0) * h, option.shadowColor, option.shadowBlur);
        context.drawImage(imgObj.img, x, y, w, h);
        clearShadow(context);
    }

    // 预览模式，如果当前元素是本元素，则绘制选中的边框效果
    if (globalContext === context && currentSprite !== null && currentSprite === option) {
        drawSelectedBoder(context, x, y, w, h);
    }

}

function drawSelectedBoder(context, x, y, w, h) {
    let strokeColor = context.strokeStyle;

    context.strokeStyle = "blue";
    context.strokeRect(x, y, w, h);
    context.strokeStyle = strokeColor;
}

/**
 * 请实现此函数以绘制实现参数要求的内容。
 *
 *
 * @param option {{
 *     x: number,
 *     y: number,
 *     size: number,
 *     radio: number,
 *     type: "g1"|"g2"|"g3",
 *     bg: string
 * }}
 */
function drawRoundedRect(context, contextWidth, contextHeight, option) {
    // 存储原始的填充样式
    const originalFillStyle = context.fillStyle;

    // 设置新的填充样式
    context.fillStyle = option.bg;

    // 开始绘制路径
    context.beginPath();

    // 绘制函数的x和y是按照图形的左上角为原点。
    // 这里将传入的中心坐标x和y转换为左上角的。

    let {x, y, w, h} = getSpritBound(option, contextWidth, contextHeight);

    applyShadow(context, (option.shadowX || 0) * w, (option.shadowY || 0) * h, option.shadowColor, option.shadowBlur);

    const radius = option.radio * (Math.min(w, h)/2);

    // 绘制不同类型的圆角矩形
    switch (option.type) {
        case 'g1':
            drawRoundedRectG1(context, x, y, w, h, radius);
            break;
        case 'g2':
            drawRoundedRectG2(context, x, y, w, h, radius);
            break;
        case 'g3':
            drawRoundedRectG3(context, x, y, w, h, radius);
            break;
        default:
            drawRoundedRectG1(context, x, y, w, h, radius);
            break;
    }

    // 封闭路径并进行填充
    context.closePath();
    context.fill();
    clearShadow(context);

    // 复原原来的填充样式
    context.fillStyle = originalFillStyle;
    // 预览模式，如果当前元素是本元素，则绘制选中的边框效果
    if (globalContext === context && currentSprite !== null && currentSprite === option) {
        drawSelectedBoder(context, x, y, w, h);
    }
}

function drawRoundedRectG1(context,x, y, width, height, radius) {
    // 画一个标准的圆角矩形
    // 顶部一横加右上角圆弧
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);

    // 右边一竖加上右下角圆弧
    context.arcTo(x + width, y + height, x, y + height, radius);

    // 下边一横加上左下圆弧
    context.arcTo(x, y + height, x, y, radius);

    // 左边一竖加上坐上圆弧
    context.arcTo(x, y, x + width, y, radius);
}

function drawRoundedRectG2(context, x, y, width, height, radius) {
    drawRoundedRectG1(context, x ,y ,width, height, radius);
}

function drawRoundedRectG3(context, x, y, width, height, radius) {
    drawRoundedRectG1(context, x ,y ,width, height, radius);
}

function drawIntoContext(context, contextWidth, contextHeight, withGrid = true) {

    if (withGrid) {
        drawBG(context, contextWidth, contextHeight, drawOption.gridCount);
    }
    for (let i = 0; i < drawOption.sprits.length; i++) {
        let sprit = drawOption.sprits[i];
        if (sprit.spritType === "rect") {
            drawRoundedRect(context, contextWidth, contextHeight, sprit);
        } else if (sprit.spritType === "img") {
            drawImg(context, contextWidth, contextHeight, sprit);
        }
    }
}

function draw() {
    drawIntoContext(globalContext, width, height);
}

function doInputCfg() {
    CfgFileSelectorDom.click();
}

function clearSelect() {
    // 取消元素选中状态
    currentSprite = null;
    currentSpriteDom = null;
    currentSpriteOptionDom = null;

    for (let i = 0; i < spriteDoms.length; i++) {
        let s = spriteDoms[i];
        s.querySelector("a").classList.remove("active");
    }

    spriteOptionEmptyDom.classList.remove("hidden");
    rectSpriteOptionWrapDom.classList.add("hidden");
    imgSpriteOptionWrapDom.classList.add("hidden");

    draw();
}
function checkbrowser() {
    var ua = navigator.userAgent.toLowerCase();
    var badBrowserCheckers = [
        () => ua.indexOf('micromessenger') != -1,
        () => ua.indexOf('alipay') != -1,
    ];

    for (let i = 0; i < badBrowserCheckers.length; i++) {
        let isBad = badBrowserCheckers[i]();
        if (isBad) {
            document.querySelector(".changebrowserTip").classList.remove('hidden');
            return false;
        }
    }

    return true;
}
function showAlert(msg, title="提示信息") {
    acModalTitleDom.textContent = title;
    acModalMsgDom.textContent = msg;
    acModalConfirmBtn.classList.add("hidden");
    ac_modal.showModal();
}

function showConfirm(msg, title="提示信息", cb) {
    acModalTitleDom.textContent = title;
    acModalMsgDom.textContent = msg;
    acModalConfirmBtn.classList.remove("hidden");
    acModalConfirmBtn.onclick = cb;
    ac_modal.showModal();
}

function randomColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    return '#' + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
}

/**
 * 四色五入保留指定位数小数点。
 * @param num
 * @param pointCount
 */
function numberRound(num, pointCount) {
    let flag = parseFloat(`1` + (''.padStart(pointCount, '0')));
    return Math.round(num * flag) / flag;
}

function doDownload(content, filename) {
    let eleLink = document.createElement('a');
    eleLink.download = filename;
    eleLink.classList.add("hidden");
    eleLink.style.display = 'none';
    let blob = new Blob([content]);
    eleLink.href = URL.createObjectURL(blob);
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
};

function loadSpriteCfg(cfg) {
    spriteDoms = [];
    drawOption.title = cfg.title;
    drawOption.sprits = cfg.sprits || [];

    // 将 原来界面上的 列表数据清空。
    spriteWrapDom.innerHTML = "";

    if (drawOption.sprits.length > 0) {
        // 显示所有元素到列表中
        for (let i = 0; i < drawOption.sprits.length; i++) {
            let s = drawOption.sprits[i];
            let si = newSpriteItemDom(s);
            spriteDoms.push(si);
        }
        spriteWrapDom.classList.remove("hidden");
        spriteEmptyDom.classList.add("hidden");
    }

    draw();
}

function addSprite(sprite) {
    drawOption.sprits.push(sprite);

    let si = newSpriteItemDom(sprite);
    spriteDoms.push(si);

    spriteWrapDom.classList.remove("hidden");
    spriteEmptyDom.classList.add("hidden");

    onSpriteClick.call(si);
}

function selectSprite(sprite, event){
    let d = spriteDoms.find(d => d.extraData === sprite);
    if (d) {
        // 当前选中的元素已经是本元素，并且元素类型是图片，那么进行图片文件选择。
        if (currentSprite === sprite && sprite.spritType === "img") {
            document.querySelector("#imgfile-selector").click();
        }

        onSpriteClick.call(d, event);
        event.stopPropagation();
    }
}

function onCanvasClick(event) {
    let {offsetX, offsetY} = event;
    offsetX *= devicePixelRatio;
    offsetY *= devicePixelRatio;
    // 寻找到本次点击是点击的哪个元素。
    for (let i = drawOption.sprits.length - 1; i >= 0; i--) {
        let b = getSpritBound(drawOption.sprits[i], width, height);
        if (
            (b.x <= offsetX && offsetX <= b.x + b.w) &&
            (b.y <= offsetY && offsetY <= b.y + b.h)
        ) {
            selectSprite(drawOption.sprits[i], event);
            return;
        }
    }

    clearSelect();
}
function onBtnLoadDefaultSpritClick() {
    let d = newSpritsDemoCfg();
    loadSpriteCfg(d);
}
function onBtnImportClick() {

    if (drawOption.sprits.length > 0) {
        showConfirm("导入元素配置会清空当前元素列表并覆盖，你确定要导入吗？", "提示信息", function () {
           doInputCfg();
           ac_modal.close();
        });
    } else {
        doInputCfg();
    }
}

function onCfgFileChange() {
    let f = CfgFileSelectorDom.files[0];
    if (!f) {
        return;
    }

    let fr = new FileReader();
    fr.onload = function () {
        try {
            let cfg = JSON.parse(fr.result);

            drawOption.title = cfg.title || "未命名配置";
            loadSpriteCfg(cfg);

            spriteOptionEmptyDom.classList.remove("hidden");
            rectSpriteOptionWrapDom.classList.add("hidden");
            imgSpriteOptionWrapDom.classList.add("hidden");
            currentSprite = null;
            currentSpriteDom = null;
            currentSpriteOptionDom = null;

            draw();

        }catch (err) {
            showAlert("导入出错，请选择正确的配置文件。错误信息：" + err.message);
        }
    }

    fr.readAsText(f);
}
function onSpriteWrapClick() {
    // 取消元素选中状态
    clearSelect();
}

function onBtnExportClick() {
    if (drawOption.sprits.length <= 0) {
        // 没什么可导出的。
        return;
    }

    let cfg = {
        title: drawOption.title,
        sprits: drawOption.sprits.map(sprite => {
            if (sprite.spritType === "img") {
                let ns = Object.assign({}, sprite);
                delete ns.drawImg;
                return ns;
            }
            return sprite;
        })
    };

    doDownload(JSON.stringify(cfg), "元素配置.json");


}

function onSpriteClick(event) {
    currentSpriteDom = this;
    currentSprite = this.extraData;

    // 将 其它元素取消高亮，将当前元素进行高亮
    for (let i = 0; i < spriteDoms.length; i++) {
        let s = spriteDoms[i];
        if (s === this) {
            s.querySelector("a").classList.add("active");
        } else {
            s.querySelector("a").classList.remove("active");
        }
    }

    spriteOptionEmptyDom.classList.add("hidden");

    // 如果有上一个面板，将上一个面板隐藏。
    if (currentSpriteOptionDom) {
        currentSpriteOptionDom.classList.add("hidden");
    }

    // 将对应的调整面板显示出来。
    if (currentSprite.spritType === "rect") {
        currentSpriteOptionDom = rectSpriteOptionWrapDom;
        rectSpriteOptionWrapDom.querySelector(".sprite-radio").value = currentSprite.radio;
        rectSpriteOptionWrapDom.querySelector(".sprite-radio-v").textContent = currentSprite.radio;
        rectSpriteOptionWrapDom.querySelector(".sprite-color").value = currentSprite.bg;
        rectSpriteOptionWrapDom.querySelector(".sprite-color-v").textContent = currentSprite.bg;
    } else if (currentSprite.spritType === "img") {
        currentSpriteOptionDom = imgSpriteOptionWrapDom;
        currentSpriteOptionDom.querySelector(".sprite-img-v").textContent = currentSprite.imgName || "未选择图片";
    }

    currentSpriteOptionDom.querySelector(".sprite-nickname").value = currentSprite.title;
    currentSpriteOptionDom.querySelector(".sprite-x").value = currentSprite.x;
    currentSpriteOptionDom.querySelector(".sprite-x-v").textContent = currentSprite.x;
    currentSpriteOptionDom.querySelector(".sprite-y").value = currentSprite.y;
    currentSpriteOptionDom.querySelector(".sprite-y-v").textContent = currentSprite.y;
    currentSpriteOptionDom.querySelector(".sprite-size").value = currentSprite.size;
    currentSpriteOptionDom.querySelector(".sprite-size-v").textContent = currentSprite.size;
    currentSpriteOptionDom.querySelector(".sprite-shadow-x").value = currentSprite.shadowX;
    currentSpriteOptionDom.querySelector(".sprite-shadow-x-v").textContent = currentSprite.shadowX;
    currentSpriteOptionDom.querySelector(".sprite-shadow-y").value = currentSprite.shadowY;
    currentSpriteOptionDom.querySelector(".sprite-shadow-y-v").textContent = currentSprite.shadowY;
    currentSpriteOptionDom.querySelector(".sprite-shadow-color").value = currentSprite.shadowColor;
    currentSpriteOptionDom.querySelector(".sprite-shadow-color-v").textContent = currentSprite.shadowColor;
    currentSpriteOptionDom.querySelector(".sprite-shadow-blur").value = currentSprite.shadowBlur;
    currentSpriteOptionDom.querySelector(".sprite-shadow-blur-v").textContent = currentSprite.shadowBlur;
    currentSpriteOptionDom.classList.remove("hidden");

    draw();

    if (event) {
        event.stopPropagation();
    }
}

function onSpriteNickNameChange() {
    currentSprite.title = this.value.trim();
    currentSpriteDom.querySelector("a .text").textContent = currentSprite.title;
    draw();
}

function onSpriteNickNameBlur() {
    if (!currentSprite.title) {
        let newTitle = "未命名";
        if (currentSprite.spritType === "rect") {
            newTitle += "形状";
        } else if (currentSprite.spritType === "img"){
            newTitle += "图片";
        } else {
            newTitle += "文本";
        }
        currentSprite.title = newTitle;
        currentSpriteDom.querySelector("a .text").textContent = currentSprite.title;
        currentSpriteOptionDom.querySelector(".sprite-nickname").value = currentSprite.title;
    }
}

function onSpriteXChange() {
    currentSprite.x = parseFloat(this.value);
    currentSpriteOptionDom.querySelector(".sprite-x-v").textContent = currentSprite.x;
    draw();
}

function onSpriteYChange() {
    currentSprite.y = parseFloat(this.value);
    currentSpriteOptionDom.querySelector(".sprite-y-v").textContent = currentSprite.y;
    draw();
}

function onSpriteSizeChange() {
    currentSprite.size = parseFloat(this.value);
    currentSpriteOptionDom.querySelector(".sprite-size-v").textContent = currentSprite.size;
    draw();
}
function onSpriteRadioChange() {
    currentSprite.radio = parseFloat(this.value);
    rectSpriteOptionWrapDom.querySelector(".sprite-radio-v").textContent = currentSprite.radio;
    draw();
}
function onSpriteColorChange() {
    currentSprite.bg = this.value;
    rectSpriteOptionWrapDom.querySelector(".sprite-color-v").textContent = currentSprite.bg;
    draw();
}
function onSpriteShadowXChange() {
    currentSprite.shadowX = numberRound(parseFloat(this.value), 2);
    currentSpriteOptionDom.querySelector(".sprite-shadow-x-v").textContent = String(currentSprite.shadowX);
    draw();
}
function onSpriteShadowYChange() {
    currentSprite.shadowY = numberRound(parseFloat(this.value), 2);
    currentSpriteOptionDom.querySelector(".sprite-shadow-y-v").textContent = String(currentSprite.shadowY);
    draw();
}
function onSpriteShadowBlurChange() {
    currentSprite.shadowBlur = this.value;
    currentSpriteOptionDom.querySelector(".sprite-shadow-blur-v").textContent = this.value;
    draw();
}
function onSpriteShadowColorChange() {
    currentSprite.shadowColor = this.value;
    currentSpriteOptionDom.querySelector(".sprite-shadow-color-v").textContent = this.value;
    draw();
}
function onSpriteFileChange() {
    if (!this.files[0]) {
        return;
    }

    delete currentSprite.drawImg;
    let fileReader = new FileReader();

    fileReader.onload = function () {
        currentSprite.img = fileReader.result;
        draw();
    }
    currentSprite.imgName = this.files[0].name;
    currentSpriteOptionDom.querySelector(".sprite-img-v").textContent = currentSprite.imgName;
    fileReader.readAsDataURL(this.files[0]);
}

function onSpriteDelClick() {
    showConfirm("你确定要删除这个元素吗？", "提示信息", function() {

        let index = drawOption.sprits.findIndex(v => v === currentSprite);
        if (index !== -1) {
            drawOption.sprits.splice(index, 1);
        }

        index = spriteDoms.findIndex(v => v === currentSpriteDom);
        if (index !== -1) {
            currentSpriteDom.remove();
            spriteDoms.splice(index, 1);
            spriteOptionEmptyDom.classList.remove("hidden");
            rectSpriteOptionWrapDom.classList.add("hidden");
            imgSpriteOptionWrapDom.classList.add("hidden");
        }

        if (spriteDoms.length <= 0) {
            spriteWrapDom.classList.add("hidden");
            spriteEmptyDom.classList.remove("hidden");
        }

        // 如果是图片元素，将选择的文件名抹除。
        if (currentSprite.spritType === "img") {
            currentSpriteOptionDom.querySelector(".sprite-img-v").textContent = "";
        }

        currentSprite = null;
        currentSpriteDom = null;
        currentSpriteOptionDom = null;

        draw();
        ac_modal.close();
    });
}

function onMenuItemRectClick() {
    addSprite({
        title: "未命名形状",
        spritType: "rect",
        x: 0.5,
        y: 0.5,
        size: numberRound(Math.random(), 2),
        radio: numberRound(Math.random(), 2),
        type: "g1",
        shadowX: 0,
        shadowY: 0,
        shadowColor: "#000000",
        shadowBlur: 0,
        bg: randomColor()
    });

    draw();
}
function onMenuItemImgClick() {

    addSprite({
        title: "未命名图片",
        spritType: "img",
        img: "", // 图片的base64
        x: 0.5,
        y: 0.5,
        size: 0.3,
        shadowX: 0,
        shadowY: 0,
        shadowColor: "#000000",
        shadowBlur: 0,
    });

    draw();
}
function onMenuItemTxtClick() {

    addSprite({
        title: "未命名文本",
        spritType: "img",
        x: 0.5,
        y: 0.5,
        size: 0.3,
        radio: 0.02,
        type: "g1",
        bg: "#aab5ff"
    });

    draw();
}

function onBtnDownloadClick() {
    if (drawOption.sprits.length <= 0) {
        return;
    }

    document.querySelector(".download-img-name").value = drawOption.title + ".png";

    download_modal.showModal();
}

function onBtnDownloadConfirmClick() {
    let size = document.querySelector(".download-img-size").value;
    size = Math.round(parseFloat(size));

    if (size <= 0) {
        size = 512;
    }

    let nameDom = document.querySelector(".download-img-name");
    let name = nameDom.value;
    if (!name) {
        name = "新图标.png";
    }
    if (!name.toLowerCase().endsWith(".png")) {
        name += ".png";
    }
    nameDom.value = name;


    let canvs = document.createElement("canvas");
    canvs.width = size;
    canvs.height = size;
    let ctx = canvs.getContext("2d");
    drawIntoContext(ctx, size, size, false);
    canvs.toBlob(function (v) {
        doDownload(v, name);
    }, "image/png", 1);


    download_modal.close();
}

function newSpriteItemDom(sprite) {
    let itemDom = SpriteItemTemplateDom.cloneNode(true);
    let adom = itemDom.querySelector("a");
    let typeTxt = {
        "rect": "形状元素",
        "img": "图片元素",
        "txt": "文本元素"
    }

    itemDom.removeAttribute("id");
    itemDom.classList.remove("hidden");
    itemDom.extraData = sprite;
    adom.querySelector(".text").textContent = sprite.title || typeTxt[sprite.spritType];

    let icon = null;
    if (sprite.spritType === "rect") {
        icon = RectSvgDom.cloneNode(true);
    } else if (sprite.spritType === "img") {
        icon = ImgSvgDom.cloneNode(true);
    } else if (sprite.spritType === "txt") {
        icon = TxtSvgDom.cloneNode(true);
    }
    icon.removeAttribute("id");
    adom.prepend(icon);

    itemDom.addEventListener("click", onSpriteClick);

    spriteWrapDom.append(itemDom);

    return itemDom;
}

window.onload = function () {
    initCanvas();
    draw();
    checkbrowser();

    spriteWrapDom.addEventListener("click", onSpriteWrapClick);

    document.querySelector("#loadDefaultSprite").addEventListener("click", onBtnLoadDefaultSpritClick);
    document.querySelector("#importBtn").addEventListener("click", onBtnImportClick);
    document.querySelector("#exportBtn").addEventListener("click", onBtnExportClick);
    document.querySelector("#menu-item-rect").addEventListener("click", onMenuItemRectClick);
    document.querySelector("#menu-item-img").addEventListener("click", onMenuItemImgClick);
    document.querySelector("#menu-item-txt").addEventListener("click", onMenuItemTxtClick);
    document.querySelector("#btn-download").addEventListener("click", onBtnDownloadClick);
    document.querySelector(".download_modal-config").addEventListener("click", onBtnDownloadConfirmClick);
    CfgFileSelectorDom.addEventListener("change", onCfgFileChange);

    rectSpriteOptionWrapDom.querySelector(".sprite-nickname").addEventListener("input", onSpriteNickNameChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-nickname").addEventListener("blur", onSpriteNickNameBlur);
    rectSpriteOptionWrapDom.querySelector(".sprite-x").addEventListener("input", onSpriteXChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-y").addEventListener("input", onSpriteYChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-size").addEventListener("input", onSpriteSizeChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-radio").addEventListener("input", onSpriteRadioChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-color").addEventListener("input", onSpriteColorChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-shadow-x").addEventListener("input", onSpriteShadowXChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-shadow-y").addEventListener("input", onSpriteShadowYChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-shadow-blur").addEventListener("input", onSpriteShadowBlurChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-shadow-color").addEventListener("input", onSpriteShadowColorChange);
    rectSpriteOptionWrapDom.querySelector(".sprite-del").addEventListener("click", onSpriteDelClick);

    imgSpriteOptionWrapDom.querySelector(".sprite-nickname").addEventListener("input", onSpriteNickNameChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-nickname").addEventListener("blur", onSpriteNickNameBlur);
    imgSpriteOptionWrapDom.querySelector(".sprite-x").addEventListener("input", onSpriteXChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-y").addEventListener("input", onSpriteYChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-size").addEventListener("input", onSpriteSizeChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-img").addEventListener("change", onSpriteFileChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-shadow-x").addEventListener("input", onSpriteShadowXChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-shadow-y").addEventListener("input", onSpriteShadowYChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-shadow-blur").addEventListener("input", onSpriteShadowBlurChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-shadow-color").addEventListener("input", onSpriteShadowColorChange);
    imgSpriteOptionWrapDom.querySelector(".sprite-del").addEventListener("click", onSpriteDelClick);
}
