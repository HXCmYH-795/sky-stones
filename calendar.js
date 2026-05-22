// 日历核心逻辑
class SkyStoneCalendar {
  constructor() {
    // 当前日期
    this.today = new Date();
    // 当前显示的月份（默认为今天的月份）
    this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    
    // 判断是否为移动端
    this.isMobile = window.innerWidth <= 640;
    
    // 开发者模式
    this.devMode = false;
    this.timeOffset = 0;
    
    // 红黑石配置数据（从外部配置文件加载，必须在 StatusBarManager 之前）
    this.stoneConfig = STONE_CONFIG;
    
    // DOM元素
    this.calendarGrid = document.getElementById('calendarGrid');
    this.exportCalendarGrid = document.getElementById('exportCalendarGrid');
    this.currentMonthEl = document.getElementById('currentMonth');
    this.exportMonthEl = document.getElementById('exportMonth');
    this.prevMonthBtn = document.getElementById('prevMonth');
    this.nextMonthBtn = document.getElementById('nextMonth');
    this.todayBtn = document.getElementById('todayBtn');
    this.toggleTodayBtn = document.getElementById('toggleTodayBtn');
    this.exportBtn = document.getElementById('exportBtn');
    
    // 模态框元素
    this.exportModal = document.getElementById('exportModal');
    this.exportedImage = document.getElementById('exportedImage');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.closeModal = document.getElementById('closeModal');
    this.shareBtn = document.getElementById('shareBtn');
    
    // 移动端详情模态框元素
    this.mobileDetailModal = document.getElementById('mobileDetailModal');
    this.closeDetailModal = document.getElementById('closeDetailModal');
    this.closeDetailBtn = document.getElementById('closeDetailBtn');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalStoneType = document.getElementById('modalStoneType');
    this.modalArea = document.getElementById('modalArea');
    this.modalTimeSlots = document.getElementById('modalTimeSlots');
    
    // 截图目标元素
    this.screenshotTarget = document.getElementById('screenshotTarget');
    
    // 状态信息条管理器
    this.statusBar = new StatusBarManager(
      this.stoneConfig,
      (day) => this.getMap(day),
      (map, dayOfWeek) => this.getArea(map, dayOfWeek),
      (dayOfWeek) => this.getTimeSlots(dayOfWeek)
    );
    
    // 控制今日标记显示状态
    this.showTodayElements = true;
    
    // 彩蛋相关
    this.achievementEgg = document.getElementById('achievementEgg');
    this.eggTriggered = false;
    
    this.updateButtonVisibility();
    this.bindEvents();
    
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => this.copyTodayInfo());
    
    this.renderCalendar();
    this.renderExportCalendar();
    this.refreshStatus();
    
    // 启动定时器，每秒更新状态
    setInterval(() => {
      this.refreshStatus();
    }, 1000);

    // 页面稳定后检查时间偏差
    setTimeout(() => {
      checkTimeOffset();
    }, 100);
  }
  
  // 刷新状态信息条
  refreshStatus() {
    const now = this.devMode ? new Date(Date.now() + this.timeOffset) : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.statusBar.update(now, this.hasRedStone(today), this.hasBlackStone(today));
  }
  
  bindEvents() {
    this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
    this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
    this.todayBtn.addEventListener('click', () => this.goToToday());
    this.toggleTodayBtn.addEventListener('click', () => this.toggleTodayElements());
    this.exportBtn.addEventListener('click', () => this.exportAsImage());
    this.closeModal.addEventListener('click', () => this.closeExportModal());
    this.shareBtn.addEventListener('click', () => this.shareImage());
    
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const closeInfoModal = document.getElementById('closeInfoModal');
    const tabUsage = document.getElementById('tab-usage');
    const tabMechanics = document.getElementById('tab-mechanics');
    const tabAbout = document.getElementById('tab-about');
    const contentUsage = document.getElementById('content-usage');
    const contentMechanics = document.getElementById('content-mechanics');
    const contentAbout = document.getElementById('content-about');
    
    infoBtn.addEventListener('click', () => {
      infoModal.classList.add('show');
      this.showTodayElements = false;
      this.updateButtonVisibility();
    });
    
    closeInfoModal.addEventListener('click', () => {
      infoModal.classList.remove('show');
      this.showTodayElements = true;
      this.updateButtonVisibility();
    });
    
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) {
        infoModal.classList.remove('show');
        this.showTodayElements = true;
        this.updateButtonVisibility();
      }
    });
    
    tabAbout.addEventListener('click', () => this.switchTab(tabAbout, tabUsage, tabMechanics, contentAbout, contentUsage, contentMechanics));
    tabUsage.addEventListener('click', () => this.switchTab(tabUsage, tabMechanics, tabAbout, contentUsage, contentMechanics, contentAbout));
    tabMechanics.addEventListener('click', () => this.switchTab(tabMechanics, tabUsage, tabAbout, contentMechanics, contentUsage, contentAbout));
    
    const devModeBtn = document.getElementById('devModeBtn');
    const devModePanel = document.getElementById('devModePanel');
    const applyDevTime = document.getElementById('applyDevTime');
    const resetDevTime = document.getElementById('resetDevTime');
    const devModeToggle = document.getElementById('devModeToggle');
    
    // 开发者模式开关事件
    if (devModeToggle) {
      devModeToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          devModePanel.classList.remove('hidden');
        } else {
          devModePanel.classList.add('hidden');
          this.devMode = false;
          this.timeOffset = 0;
          document.getElementById('devDateTime').value = '';
          this.refreshStatus();
        }
      });
    }
    
    devModeBtn.addEventListener('click', () => {
      devModePanel.classList.toggle('hidden');
    });
    
    applyDevTime.addEventListener('click', () => {
      const devDateTime = document.getElementById('devDateTime');
      if (devDateTime.value) {
        this.devMode = true;
        const targetTime = new Date(devDateTime.value);
        this.timeOffset = targetTime.getTime() - Date.now();
        this.refreshStatus();
      } else {
        alert('请选择一个有效的时间');
      }
    });
    
    resetDevTime.addEventListener('click', () => {
      this.devMode = false;
      this.timeOffset = 0;
      document.getElementById('devDateTime').value = '';
      this.refreshStatus();
    });
    
    if (this.isMobile) {
      this.closeDetailModal.addEventListener('click', () => this.closeMobileDetailModal());
      this.closeDetailBtn.addEventListener('click', () => this.closeMobileDetailModal());
      this.mobileDetailModal.addEventListener('click', (e) => {
        if (e.target === this.mobileDetailModal) this.closeMobileDetailModal();
      });
    }
    
    this.addTouchEvents();
    
    const modalCopyBtn = document.getElementById('modalCopyBtn');
    if (modalCopyBtn) modalCopyBtn.addEventListener('click', () => this.copyModalInfo());
    
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 640;
      if (wasMobile !== this.isMobile) {
        this.renderCalendar();
        if (this.mobileDetailModal) this.mobileDetailModal.classList.remove('show');
      }
    });
  }
  
  switchTab(activeTab, ...otherTabs) {
    const [tab2, tab3, activeContent, content2, content3] = otherTabs;
    
    [activeTab, tab2, tab3].forEach(tab => {
      tab.classList.remove('active', 'border-primary', 'text-primary');
      tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    activeTab.classList.add('active', 'border-primary', 'text-primary');
    
    activeContent.classList.remove('hidden');
    content2.classList.add('hidden');
    content3.classList.add('hidden');
  }
  
  addTouchEvents() {
    let startX = 0;
    const calendarEl = document.getElementById('calendarGrid').parentElement;
    
    calendarEl.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, false);
    
    calendarEl.addEventListener('touchend', (e) => {
      if (!startX) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = endX - startX;
      if (diffX > 50) this.changeMonth(-1);
      else if (diffX < -50) this.changeMonth(1);
      startX = 0;
    }, false);
  }
  
  changeMonth(step) {
    this.calendarGrid.classList.add('calendar-exit');
    setTimeout(() => {
      this.currentDate.setMonth(this.currentDate.getMonth() + step);
      this.checkEggTrigger();
      this.renderCalendar();
      this.renderExportCalendar();
      setTimeout(() => {
        this.calendarGrid.classList.remove('calendar-exit');
      }, 50);
    }, 300);
  }
  
  checkEggTrigger() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    if (year === 2019 && month === 5 && !this.eggTriggered) {
      this.triggerAchievementEgg();
      this.eggTriggered = true;
    }
  }
  
  triggerAchievementEgg() {
    this.achievementEgg.classList.add('show');
    setTimeout(() => {
      this.achievementEgg.classList.remove('show');
      setTimeout(() => { this.eggTriggered = false; }, 1000);
    }, 5000);
  }
  
  toggleTodayElements() {
    this.showTodayElements = !this.showTodayElements;
    this.updateButtonVisibility();
    this.renderCalendar();
  }
  
  updateButtonVisibility() {
    const copyBtn = document.getElementById('copyBtn');
    const infoBtn = document.getElementById('infoBtn');
    
    if (this.showTodayElements) {
      this.todayBtn.style.display = 'block';
      this.exportBtn.style.display = 'flex';
      if (copyBtn) copyBtn.style.display = 'flex';
      if (infoBtn) infoBtn.style.display = 'flex';
      this.toggleTodayBtn.innerHTML = '<i class="fa fa-eye"></i>';
      this.toggleTodayBtn.setAttribute('aria-label', '隐藏今日元素');
    } else {
      this.todayBtn.style.display = 'none';
      this.exportBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';
      if (infoBtn) infoBtn.style.display = 'none';
      this.toggleTodayBtn.innerHTML = '<i class="fa fa-eye-slash"></i>';
      this.toggleTodayBtn.setAttribute('aria-label', '显示今日元素');
    }
  }
  
  goToToday() {
    this.calendarGrid.classList.add('calendar-exit');
    setTimeout(() => {
      this.currentDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
      this.renderCalendar();
      this.renderExportCalendar();
      setTimeout(() => {
        this.calendarGrid.classList.remove('calendar-exit');
      }, 50);
    }, 300);
  }
  
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.currentMonthEl.innerHTML = `${year}年${month + 1}月`;
    this.calendarGrid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = 0; i < firstDayAdjusted; i++) {
      const day = daysInPrevMonth - firstDayAdjusted + i + 1;
      const dayDate = new Date(year, month - 1, day);
      const isToday = this.isSameDay(dayDate, this.today);
      this.calendarGrid.appendChild(this.createDayElement(day, false, isToday, dayDate));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isToday = this.isSameDay(dayDate, this.today);
      this.calendarGrid.appendChild(this.createDayElement(i, true, isToday, dayDate));
    }
    
    const totalDays = firstDayAdjusted + daysInMonth;
    const nextMonthDays = 42 - totalDays;
    
    for (let i = 1; i <= nextMonthDays; i++) {
      const dayDate = new Date(year, month + 1, i);
      const isToday = this.isSameDay(dayDate, this.today);
      this.calendarGrid.appendChild(this.createDayElement(i, false, isToday, dayDate));
    }
  }
  
  createDayElement(day, isCurrentMonth, isToday, date) {
    const dayEl = document.createElement('div');
    const dayOfWeek = date.getDay();
    const hasRed = this.hasRedStone(date);
    const hasBlack = this.hasBlackStone(date);
    
    if (this.isMobile) {
      dayEl.className = 'mobile-day-cell rounded-md relative';
      if (isCurrentMonth && (hasRed || hasBlack)) dayEl.classList.add('hover:opacity-90');
    } else {
      dayEl.className = 'pc-day-cell rounded-md calendar-day-hover relative';
    }
    
    if (!isCurrentMonth) {
      dayEl.classList.add('text-gray-400', 'bg-neutral');
    } else if (hasRed) {
      dayEl.classList.add('redstone-bg');
    } else if (hasBlack) {
      dayEl.classList.add('blackstone-bg');
    } else {
      dayEl.classList.add('text-gray-800', 'bg-white');
    }
    
    if (this.isMobile) {
      this.createMobileDayContent(dayEl, day, hasRed, hasBlack);
      if (isCurrentMonth && (hasRed || hasBlack)) {
        dayEl.addEventListener('click', () => this.showMobileDetailModal(date, hasRed, hasBlack));
      }
    } else {
      this.createPcDayContent(dayEl, day, date, hasRed, hasBlack, dayOfWeek);
    }
    
    if (this.showTodayElements && isToday) {
      const todayBadge = document.createElement('div');
      todayBadge.className = 'today-badge';
      todayBadge.textContent = '今日';
      dayEl.appendChild(todayBadge);
    }
    
    return dayEl;
  }
  
  createMobileDayContent(dayEl, day, hasRed, hasBlack) {
    const dateNum = document.createElement('div');
    dateNum.className = 'mobile-date-num';
    dateNum.textContent = day;
    dayEl.appendChild(dateNum);
    
    if (hasRed || hasBlack) {
      const typeTag = document.createElement('div');
      typeTag.className = 'mobile-stone-type';
      typeTag.textContent = hasRed ? '红石' : '黑石';
      dayEl.appendChild(typeTag);
    }
  }
  
  createPcDayContent(dayEl, day, date, hasRed, hasBlack, dayOfWeek) {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center header-row justify-center';
    
    const dateNum = document.createElement('div');
    dateNum.className = 'text-lg font-semibold date-num';
    dateNum.textContent = day;
    headerRow.appendChild(dateNum);
    
    if (hasRed || hasBlack) {
      const typeTag = document.createElement('div');
      typeTag.className = 'stone-type';
      typeTag.textContent = hasRed ? '红石' : '黑石';
      headerRow.appendChild(typeTag);
    }
    
    contentContainer.appendChild(headerRow);
    
    if (hasRed || hasBlack) {
      const map = this.getMap(day);
      const area = this.getArea(map, dayOfWeek);
      const areaEl = document.createElement('div');
      areaEl.className = 'stone-area';
      areaEl.textContent = `${map}·${area}`;
      contentContainer.appendChild(areaEl);
      
      const timeSlots = this.getTimeSlots(dayOfWeek);
      const timesContainer = document.createElement('div');
      timesContainer.className = 'stone-time';
      timeSlots.forEach(time => {
        const timeEl = document.createElement('div');
        timeEl.textContent = time;
        timesContainer.appendChild(timeEl);
      });
      contentContainer.appendChild(timesContainer);
    }
    
    dayEl.appendChild(contentContainer);
  }
  
  showMobileDetailModal(date, hasRed, hasBlack) {
    if (!this.isMobile) return;
    
    this.modalTitle.textContent = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    
    const stoneType = hasRed ? '红石' : '黑石';
    this.modalStoneType.textContent = stoneType;
    this.modalStoneType.className = hasRed ? 'text-2xl font-bold mb-3 text-primary' : 'text-2xl font-bold mb-3 text-blackstone';
    
    const map = this.getMap(date.getDate());
    const area = this.getArea(map, date.getDay());
    this.modalArea.textContent = `${map}·${area}`;
    
    this.modalTimeSlots.innerHTML = '';
    this.getTimeSlots(date.getDay()).forEach(time => {
      const li = document.createElement('li');
      li.textContent = time;
      this.modalTimeSlots.appendChild(li);
    });
    
    this.mobileDetailModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  
  copyModalInfo() {
    const title = document.getElementById('modalTitle').textContent;
    const type = document.getElementById('modalStoneType').textContent;
    const area = document.getElementById('modalArea').textContent;
    const timeSlots = Array.from(document.getElementById('modalTimeSlots').querySelectorAll('li')).map(li => li.textContent).join('\n');
    
    const dateMatch = title.match(/(\d+)年(\d+)月(\d+)日/);
    if (!dateMatch) return;
    
    const [, , month, day] = dateMatch;
    
    const infoText = `${month}月${day}日红黑石信息
----------------------
类型：${type}
地点：${area}
时间：${timeSlots}
----------------------
By光遇国服红黑石日历
sky-stones.pages.dev`;
    
    navigator.clipboard.writeText(infoText).then(() => {
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = '信息已复制到剪贴板！';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }).catch(() => alert('复制失败，请手动复制'));
  }
  
  closeMobileDetailModal() {
    if (this.mobileDetailModal) {
      this.mobileDetailModal.classList.remove('show');
      document.body.style.overflow = '';
    }
  }
  
  renderExportCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    this.exportMonthEl.innerHTML = `${year}年${month + 1}月`;
    this.exportCalendarGrid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    for (let i = 0; i < firstDayAdjusted; i++) {
      const day = daysInPrevMonth - firstDayAdjusted + i + 1;
      this.exportCalendarGrid.appendChild(this.createExportDayElement(day, false, new Date(year, month - 1, day)));
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      this.exportCalendarGrid.appendChild(this.createExportDayElement(i, true, new Date(year, month, i)));
    }
    
    const totalDays = firstDayAdjusted + daysInMonth;
    for (let i = 1; i <= 42 - totalDays; i++) {
      this.exportCalendarGrid.appendChild(this.createExportDayElement(i, false, new Date(year, month + 1, i)));
    }
  }
  
  createExportDayElement(day, isCurrentMonth, date) {
    const dayEl = document.createElement('div');
    const dayOfWeek = date.getDay();
    const hasRed = this.hasRedStone(date);
    const hasBlack = this.hasBlackStone(date);
    
    dayEl.className = 'pc-day-cell rounded-md relative';
    
    if (!isCurrentMonth) {
      dayEl.classList.add('text-gray-400', 'bg-neutral');
    } else if (hasRed) {
      dayEl.classList.add('redstone-bg');
    } else if (hasBlack) {
      dayEl.classList.add('blackstone-bg');
    } else {
      dayEl.classList.add('text-gray-800', 'bg-white');
    }
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'content-container';
    
    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center header-row justify-center';
    
    const dateNum = document.createElement('div');
    dateNum.className = 'text-lg font-semibold date-num';
    dateNum.textContent = day;
    headerRow.appendChild(dateNum);
    
    if (hasRed || hasBlack) {
      const typeTag = document.createElement('div');
      typeTag.className = 'stone-type';
      typeTag.textContent = hasRed ? '红石' : '黑石';
      headerRow.appendChild(typeTag);
    }
    
    contentContainer.appendChild(headerRow);
    
    if (hasRed || hasBlack) {
      const map = this.getMap(day);
      const area = this.getArea(map, dayOfWeek);
      const areaEl = document.createElement('div');
      areaEl.className = 'stone-area';
      areaEl.textContent = this.isMobile ? area : `${map}·${area}`;
      contentContainer.appendChild(areaEl);
      
      const timesContainer = document.createElement('div');
      timesContainer.className = 'stone-time';
      this.getTimeSlots(dayOfWeek).forEach(time => {
        const timeEl = document.createElement('div');
        timeEl.textContent = this.isMobile ? time.replace('~', '-') : time;
        timesContainer.appendChild(timeEl);
      });
      contentContainer.appendChild(timesContainer);
    }
    
    dayEl.appendChild(contentContainer);
    return dayEl;
  }
  
  copyTodayInfo() {
    const now = this.devMode ? new Date(Date.now() + this.timeOffset) : new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const hasRed = this.hasRedStone(today);
    const hasBlack = this.hasBlackStone(today);
    
    let type = '无', location = '无', time = '无';
    
    if (hasRed) type = '红石';
    else if (hasBlack) type = '黑石';
    
    if (hasRed || hasBlack) {
      const dayOfWeek = today.getDay();
      location = `${this.getMap(day)}·${this.getArea(this.getMap(day), dayOfWeek)}`;
      time = this.getTimeSlots(dayOfWeek).join('\n');
    }
    
    const infoText = `${month}月${day}日红黑石信息
----------------------
类型：${type}
地点：${location}
时间：${time}
----------------------
By光遇国服红黑石日历
sky-stones.pages.dev`;
    
    navigator.clipboard.writeText(infoText).then(() => {
      const notification = document.createElement('div');
      notification.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = '今日信息已复制到剪贴板！';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }).catch(() => alert('复制失败，请手动复制'));
  }
  
  exportAsImage() {
    if (this.mobileDetailModal) this.mobileDetailModal.classList.remove('show');
    
    this.screenshotTarget.style.display = 'block';
    this.screenshotTarget.style.position = 'relative';
    this.screenshotTarget.style.zIndex = '100';
    
    if (this.isMobile) {
      this.screenshotTarget.style.maxWidth = '100%';
      this.screenshotTarget.style.width = '100%';
      this.screenshotTarget.style.left = '0';
      this.screenshotTarget.classList.add('mobile-screenshot');
      this.screenshotTarget.classList.remove('pc-screenshot');
      window.scrollTo(0, 0);
    } else {
      this.screenshotTarget.classList.add('pc-screenshot');
      this.screenshotTarget.classList.remove('mobile-screenshot');
    }
    
    setTimeout(() => {
      html2canvas(this.screenshotTarget, {
        scale: this.isMobile ? 3 : 2,
        useCORS: true,
        backgroundColor: '#FAFAFA',
        width: this.screenshotTarget.offsetWidth,
        height: this.screenshotTarget.offsetHeight,
        logging: false,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.style.position === 'fixed' && element.style.zIndex > 10;
        }
      }).then(canvas => {
        this.screenshotTarget.style.display = 'none';
        this.screenshotTarget.style.position = 'absolute';
        this.screenshotTarget.style.zIndex = '-1';
        this.screenshotTarget.classList.remove('mobile-screenshot', 'pc-screenshot');
        
        const imageUrl = canvas.toDataURL('image/png', 1.0);
        this.exportedImage.src = imageUrl;
        this.downloadBtn.href = imageUrl;
        this.downloadBtn.download = `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月光遇红黑石日历.png`;
        this.exportModal.classList.remove('hidden');
        
        if (this.isMobile) {
          this.exportedImage.style.maxHeight = '60vh';
          this.exportedImage.style.objectFit = 'contain';
        }
      }).catch(() => {
        this.screenshotTarget.style.display = 'none';
        this.screenshotTarget.style.position = 'absolute';
        this.screenshotTarget.style.zIndex = '-1';
        this.screenshotTarget.classList.remove('mobile-screenshot', 'pc-screenshot');
        alert('截图失败，请重试！');
      });
    }, 800);
  }
  
  closeExportModal() {
    this.exportModal.classList.add('hidden');
  }
  
  shareImage() {
    if (navigator.share) {
      fetch(this.exportedImage.src)
        .then(response => response.blob())
        .then(blob => {
          const file = new File([blob], `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月光遇红黑石日历.png`, { type: 'image/png' });
          navigator.share({
            title: '光遇红黑石日历',
            text: `${this.currentDate.getFullYear()}年${this.currentDate.getMonth() + 1}月光遇红黑石日历`,
            files: [file]
          }).catch(() => {});
        });
    } else {
      alert('您的浏览器不支持分享功能，请手动下载图片分享');
    }
  }
  
  hasRedStone(date) {
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const config = this.stoneConfig;
    if (day <= config.halfMonthBoundary) {
      return config.redStoneDays.firstHalf.includes(dayOfWeek);
    } else {
      return config.redStoneDays.secondHalf.includes(dayOfWeek);
    }
  }

  hasBlackStone(date) {
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const config = this.stoneConfig;
    if (this.isCrossMonthHalf(date)) return false;
    if (day <= config.halfMonthBoundary) {
      return config.blackStoneDays.firstHalf.includes(dayOfWeek);
    } else {
      return config.blackStoneDays.secondHalf.includes(dayOfWeek);
    }
  }
  
  isCrossMonthHalf(date) {
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const month = date.getMonth();
    const year = date.getFullYear();

    if (dayOfWeek === 2) {
      const wednesday = new Date(year, month, day + 1);
      if (wednesday.getMonth() !== month) return true;
      if (wednesday.getDate() >= 16 && day <= 15) return true;
      return false;
    }

    if (dayOfWeek === 3) {
      if (day >= 16 && day <= 22) {
        const tuesday = day - 1;
        if (tuesday <= 15) return true;
      }
      return false;
    }

    return false;
  }
  
  getTimeSlots(dayOfWeek) {
    return this.stoneConfig.timeSlots[dayOfWeek] || [];
  }
  
  getMap(day) {
    return this.stoneConfig.maps[day % 5];
  }
  
  getArea(map, dayOfWeek) {
    return this.stoneConfig.areas[map][dayOfWeek] || '';
  }
  
  isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SkyStoneCalendar();

  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  const aboutVersionElement = document.getElementById('aboutVersion');
  if (aboutVersionElement) {
    aboutVersionElement.textContent = APP_VERSION;
  }
  
  const versionElement = document.getElementById('appVersion');
  if (versionElement) {
    versionElement.textContent = APP_VERSION;
  }

  document.title = `光遇国服红黑石日历 ${APP_VERSION}`;
});