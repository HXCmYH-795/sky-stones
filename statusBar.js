// 状态信息条管理器
// 负责信息条文本、倒计时、边框颜色的所有逻辑

class StatusBarManager {
  constructor(stoneConfig, getMapFn, getAreaFn, getTimeSlotsFn) {
    this.stoneConfig = stoneConfig;
    this.getMap = getMapFn;
    this.getArea = getAreaFn;
    this.getTimeSlots = getTimeSlotsFn;

    this.statusInfoBox = document.getElementById('statusInfoBox');
    this.statusInfoText = document.getElementById('statusInfoText');
    this.countdownEl = document.getElementById('countdownTimer');
  }

  // 主入口：每秒由日历调用一次
  update(now, hasRed, hasBlack) {
    if (!hasRed && !hasBlack) {
      this.statusInfoText.textContent = '今天无红黑石';
      this.setBorderColor(false, false, false, false);
      this.hideCountdown();
      return;
    }

    const dayOfWeek = now.getDay();
    const timeSlots = this.getTimeSlots(dayOfWeek);
    const { statusText, foundActiveSlot } = this.buildStatusText(now, dayOfWeek, timeSlots, hasRed, hasBlack);

    const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const upcomingSlots = timeSlots.filter(slot => {
      const [start] = slot.split('~');
      const [h, m] = start.split(':').map(Number);
      return (h * 3600 + m * 60) > currentTimeInSeconds;
    });
    const allEnded = !foundActiveSlot && upcomingSlots.length === 0;

    this.setBorderColor(hasRed, hasBlack, foundActiveSlot, allEnded);
    this.statusInfoText.innerHTML = statusText;
  }

  // 构建信息条文本
  buildStatusText(now, dayOfWeek, timeSlots, hasRed, hasBlack) {
    const currentSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const stoneType = hasRed ? '红石' : '黑石';
    const stoneColor = hasRed ? 'text-primary' : 'text-blackstone';
    const stoneStyle = hasRed ? 'font-bold' : 'font-bold underline decoration-dotted';

    for (const slot of timeSlots) {
      const [start, end] = slot.split('~');
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const startSec = sh * 3600 + sm * 60;
      const endSec = eh * 3600 + em * 60;

      if (currentSec >= startSec && currentSec < endSec) {
        const remainingSeconds = endSec - currentSec;
        const remainingMinutes = remainingSeconds / 60;
        const map = this.getMap(now.getDate());
        const area = this.getArea(map, dayOfWeek);

        let text;
        if (remainingMinutes <= 5) {
          const warning = hasRed ? '未能在结束前完成无法获得升华蜡烛' : '未能在结束前完成无法获得烛火';
          text = `<span class="${stoneColor} ${stoneStyle}">${stoneType}</span>即将结束 <button class="text-blue-500 hover:text-blue-700 ml-1" onclick="showTooltip(event, '${warning}')"><i class="fa fa-question-circle"></i></button><br>降落地点：${map}·${area}<br>时间：${slot}`;
        } else if (remainingMinutes <= 10) {
          text = `<span class="${stoneColor} ${stoneStyle}">${stoneType}</span>即将结束<br>降落地点：${map}·${area}<br>时间：${slot}`;
        } else {
          text = `<span class="${stoneColor} ${stoneStyle}">${stoneType}</span>正在进行中<br>降落地点：${map}·${area}<br>时间：${slot}`;
        }

        this.showCountdown(hasRed, remainingSeconds);
        return { statusText: text, foundActiveSlot: true };
      }
    }

    // 不在任何时段内
    this.hideCountdown();
    const upcoming = timeSlots.filter(slot => {
      const [start] = slot.split('~');
      const [h, m] = start.split(':').map(Number);
      return (h * 3600 + m * 60) > currentSec;
    });

    let text;
    if (upcoming.length === 0) {
      text = `今日<span class="${stoneColor} ${stoneStyle}">${stoneType}</span>已全部结束`;
    } else {
      let closest = upcoming[0];
      let minDiff = Infinity;
      upcoming.forEach(slot => {
        const [start] = slot.split('~');
        const [h, m] = start.split(':').map(Number);
        const diff = (h * 3600 + m * 60) - currentSec;
        if (diff < minDiff) { minDiff = diff; closest = slot; }
      });

      const hours = Math.floor(minDiff / 3600);
      const minutes = Math.floor((minDiff % 3600) / 60);
      const seconds = Math.floor(minDiff % 60);

      let timeStr;
      if (minDiff < 60) {
        timeStr = `${seconds}秒`;
      } else if (minutes === 0) {
        timeStr = `${hours}小时`;
      } else if (hours > 0) {
        timeStr = `${hours}小时${minutes}分钟`;
      } else {
        timeStr = `${minutes}分钟`;
      }

      text = `距离下一场<span class="${stoneColor} ${stoneStyle}">${stoneType}</span>还有${timeStr}`;
      const map = this.getMap(now.getDate());
      const area = this.getArea(map, dayOfWeek);
      text += `<br>降落地点：${map}·${area}`;
    }

    return { statusText: text, foundActiveSlot: false };
  }

  // 显示倒计时
  showCountdown(isRed, remainingSeconds) {
    if (!this.countdownEl) return;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    this.countdownEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    this.countdownEl.classList.remove('hidden');
    this.countdownEl.className = isRed
      ? 'absolute top-1.5 right-2 text-sm font-mono font-bold px-2 py-0.5 rounded-md bg-red-100 text-primary'
      : 'absolute top-1.5 right-2 text-sm font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-blackstone';
  }

  // 隐藏倒计时
  hideCountdown() {
    if (this.countdownEl) this.countdownEl.classList.add('hidden');
  }

  // 设置边框颜色
  setBorderColor(hasRed, hasBlack, isActive, allEnded) {
    if (allEnded || (!hasRed && !hasBlack)) {
      this.statusInfoBox.style.borderColor = '#D1D5DB';
      this.statusInfoBox.style.borderWidth = '1px';
    } else if (isActive || hasRed || hasBlack) {
      this.statusInfoBox.style.borderColor = hasRed ? '#D05D5A' : '#6B6B6B';
      this.statusInfoBox.style.borderWidth = '2px';
    }
  }
}