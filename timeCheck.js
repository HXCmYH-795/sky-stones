// 时间校准模块
// 通过多个网络时间接口校准用户设备时间，偏差过大时在信息框显示提示

async function fetchServerTime() {
  // 接口1: ddnspod
  try {
    const res = await fetch("https://ip.ddnspod.com/timestamp");
    const text = await res.text();
    const timestamp = parseInt(text.trim());
    if (timestamp > 0) return timestamp;
  } catch (e) {
    console.warn("接口1（时间校准）失败", e);
  }

  // 接口2: vivo
  try {
    const res = await fetch("http://mshopact.vivo.com.cn/tool/config");
    const data = await res.json();
    if (data.success && data.data && data.data.nowTime) {
      return data.data.nowTime;
    }
  } catch (e) {
    console.warn("接口2（时间校准）失败", e);
  }

  // 接口3: 小米有品
  try {
    const res = await fetch("https://tptm.hd.mi.com/gettimestamp");
    const text = await res.text();
    const parts = text.split("=");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[1].trim());
      if (timestamp > 0) return timestamp;
    }
  } catch (e) {
    console.warn("接口3（时间校准）失败", e);
  }

  // 接口4: 苏宁
  try {
    const res = await fetch("https://quan.suning.com/getSysTime.do");
    const data = await res.json();
    if (data.sysTime2) {
      return new Date(data.sysTime2.replace(" ", "T")).getTime();
    }
  } catch (e) {
    console.warn("接口4（时间校准）失败", e);
  }

  // 接口5: 阿里云
  try {
    const res = await fetch("https://cn.apihz.cn/api/time/getapi.php?id=88888888&key=88888888&type=1");
    const data = await res.json();
    if (data.code === 200 && data.msg) {
      return parseInt(data.msg) * 1000;
    }
  } catch (e) {
    console.warn("接口5（时间校准）失败", e);
  }

  return null;
}

async function checkTimeOffset() {
  const serverTime = await fetchServerTime();
  if (!serverTime) return;

  const localTime = Date.now();
  const diffSeconds = Math.abs(localTime - serverTime) / 1000;
  const diffMinutes = Math.round(diffSeconds / 60);

  const statusBox = document.getElementById('statusInfoBox');
  let warningElement = document.getElementById('timeWarning');

  if (diffSeconds > 300) {
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = 'timeWarning';
      warningElement.className = 'text-xs text-red-600 mt-2 font-medium';
      statusBox.appendChild(warningElement);
    }
    warningElement.textContent = `设备时间偏差较大（约 ${diffMinutes} 分钟），请校准后再使用`;
  } else if (diffSeconds > 30) {
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = 'timeWarning';
      warningElement.className = 'text-xs text-yellow-600 mt-2 font-medium';
      statusBox.appendChild(warningElement);
    }
    warningElement.textContent = `设备时间可能有轻微偏差（约 ${diffMinutes} 分钟）`;
  } else {
    if (warningElement) {
      warningElement.remove();
    }
  }
}