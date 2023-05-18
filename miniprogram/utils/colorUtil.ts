const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

let rgb2Hsl = function (r, g, b) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

let hsl2Rgb = function (h, s, l) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 色域转换到RGB
const hsv2Rgb = (h, s, v) => {
  var r, g, b;
  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 色域转换到HSV
const rgb2Hsv = (r, g, b) => {
  r = r / 255, g = g / 255, b = b / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return Math.round(h * 360);
}

let drawRing = function (ctx, width, height) {
  // 画圆环
  var radius = width / 2;
  var toRad = (2 * Math.PI) / 360;
  var step = 0.1;
  for (var i = 0; i < 360; i += step) {
    var rad = i * toRad;
    var color = hslToRgb(i / 360, 1, 0.5);
    ctx.strokeStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.lineTo(radius + radius * Math.cos(rad), radius + radius * Math.sin(rad));
    ctx.stroke();
  }

  ctx.fillStyle = 'rgb(255, 255, 255)';
  ctx.strokeStyle = 'rgb(0, 255, 255)';
  ctx.beginPath();
  ctx.arc(radius, radius, radius * 0.65, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.draw();
};

let drawSlider = function (ctx, width, height, angle) {
  var radius = width / 2;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);

  var color = hslToRgb(angle, 1, 0.5);

  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.rotate((angle * 360) * Math.PI / 180);

  ctx.beginPath()
  ctx.setLineWidth(height * 0.015);
  //圆心的 x 坐标  , 圆心的 Y 坐标 , 圆的半径
  ctx.arc(height * 0.41, 0, 17, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgb(255, 255, 255)';
  ctx.stroke()

  ctx.draw();
  ctx.restore();
};

// 创建画布
const createCanvas = (self) => {
  var context = wx.createCanvasContext('firstCanvas', self);
  var width = Math.floor(self.data.width * 0.7),
    height = width,
    cx = width / 2,
    cy = height / 2,
    radius = width / 2.3,
    imageData,
    pixels,
    hue, sat, value,
    i = 0, x, y, rx, ry, d,
    f, g, p, u, v, w, rgb;
  wx.canvasGetImageData({
    canvasId: 'firstCanvas',
    x: 0,
    y: 0,
    width: width,
    height: height,
    success(res) {
      var pixels = res.data;
      for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++, i = i + 4) {
          rx = x - cx;
          ry = y - cy;
          d = rx * rx + ry * ry;
          if (d < radius * radius) {
            hue = 6 * (Math.atan2(ry, rx) + Math.PI) / (2 * Math.PI);
            sat = Math.sqrt(d) / radius;
            g = Math.floor(hue);
            f = hue - g;
            u = 255 * (1 - sat);
            v = 255 * (1 - sat * f);
            w = 255 * (1 - sat * (1 - f));
            pixels[i] = [255, v, u, u, w, 255, 255][g];
            pixels[i + 1] = [w, 255, 255, v, u, u, w][g];
            pixels[i + 2] = [u, u, w, 255, 255, v, u][g];
            pixels[i + 3] = 255;
          }
        }
      }
      wx.canvasPutImageData({
        canvasId: 'firstCanvas',
        x: 0,
        y: 0,
        width: width,
        height: height,
        data: pixels,
        success(res) {
          setTimeout(function () {
            context.beginPath();
            context.arc(cx, cy, radius * 0.6, 0, 2 * Math.PI);
            context.fillStyle = "#12151e";
            context.fill();
            context.stroke();
            context.draw(true);
            context.beginPath();
            context.arc(cx, cy, radius, 0, 2 * Math.PI);
            context.strokeStyle = "#12151e";
            context.lineWidth = 5;
            context.stroke();
            context.draw(true);
          })

        },
        fail(res) {
        }
      }, self)
    }
  })
}

const getColor = (self, event) => {
  console.log(event);
  var x = event.touches[0].x,
    y = event.touches[0].y;
  wx.canvasGetImageData({
    canvasId: "firstCanvas",
    x: x,
    y: y,
    width: 1,
    height: 1,
    success(res) {
      var r = res.data[0],
        g = res.data[1],
        b = res.data[2];
      console.log(r, g, b);
      // 特殊值过滤
      if ((r == 0 && g == 0 && b == 0) || (r == 18 && g == 21 && b == 30)) {
        return false;
      } else {
        self.setData({
          color: "rgba(" + r + ", " + g + ", " + b + ", " + self.data.currentLuminanceText / 100 + ")",
          currentSaturationText: 100,
          currentSaturation: 100,
          currentHue: rgbToHsv(r, g, b)
        })
        self.setDeviceStatus();
      }
    }
  })
}

module.exports = {
  rgb2Hsl: rgb2Hsl,
  hsl2Rgb: hsl2Rgb,
  rgb2Hsv: rgb2Hsv,
  hsv2Rgb: hsv2Rgb,
  drawRing: drawRing,
  drawSlider: drawSlider,
  createCanvas: createCanvas,
  getColor: getColor,
  formatTime: formatTime
}
