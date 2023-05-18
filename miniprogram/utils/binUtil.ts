const buf2Str = (buffer: any, start: number|undefined = 0, length: number|undefined): string => {
  if (length === undefined) {
    length = buffer.byteLength
  }
  return String.fromCharCode(...new Uint8Array(buffer, start, length).filter(x => x !== 0))
}

const buf2Hex = (buffer: any, start: number|undefined  = 0, length: number|undefined): string => {
  if (length === undefined) {
    length = buffer.byteLength
  }
  return Array.from(new Uint8Array(buffer, start, length).values()).map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}

const str2Buf = (str: string): Uint8Array => {
  return Uint8Array.from(str.split('').map(x => x.charCodeAt(0)))
}

const hex2Buf = (hex: string): Uint8Array => {
  const array: [number] = []
  for (let i = 0; i < hex.length; i += 2) {
    const s = hex[i] + hex[i + 1]
    array.push(parseInt(s, 16))
  }
  return Uint8Array.from(array)
}

//16进制转字符串
const hexCharCodeToStr = hexCharCodeStr => {
  var trimedStr = hexCharCodeStr.trim();
  var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
  var len = rawStr.length;
  if (len % 2 !== 0) {
    alert("Illegal Format ASCII Code!");
    return "";
  }
  var curCharCode;
  var resultStr = [];
  for (var i = 0; i < len; i = i + 2) {
    curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
    resultStr.push(String.fromCharCode(curCharCode));
  }
  return resultStr.join("");
}

//unit8Arry转数组
const uint8ArrayToArray = uint8Array => {
  var array = [];

  for (var i = 0; i < uint8Array.byteLength; i++) {
    array[i] = uint8Array[i];
  }

  return array;
}

//16进制转二进制数组 
const hexToBinArray = str => {
  var dec = parseInt(str, 16),
    bin = dec.toString(2),
    len = bin.length;
  if (len < 8) {
    var diff = 8 - len,
      zeros = "";
    for (var i = 0; i < diff; i++) {
      zeros += "0";
    }
    bin = zeros + bin;
  }
  return bin.split("");
}

//16进制转数组
const hexByArray = str => {
  var arr = [];
  if (str.length % 2 != 0) {
    str = "0" + str;
  }
  for (var i = 0; i < str.length; i += 2) {
    arr.push(str.substring(i, i + 2))
  }
  return arr;
}

//16进制转整形数组
const hexByInt = str => {
  var arr = [];
  if (str.length % 2 != 0) {
    str = "0" + str;
  }
  for (var i = 0; i < str.length; i += 2) {
    arr.push(parseInt(str.substring(i, i + 2), 16))
  }
  return arr;
}

module.exports = {
  buf2Str,
  buf2Hex,
  str2Buf,
  hex2Buf,
  hexCharCodeToStr: hexCharCodeToStr,
  uint8ArrayToArray: uint8ArrayToArray,
  hexToBinArray: hexToBinArray,
  hexByArray: hexByArray,
  hexByInt: hexByInt,
}