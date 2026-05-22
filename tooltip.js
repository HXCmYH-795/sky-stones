// 显示提示信息的函数
function showTooltip(event, text) {
  // 创建提示元素
  let tooltip = document.getElementById('statusTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'statusTooltip';
    tooltip.className = 'fixed bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none z-50';
    document.body.appendChild(tooltip);
  }
  
  // 设置提示内容和位置
  tooltip.textContent = text;
  
  // 计算位置，避免超出屏幕
  let left = event.clientX + 10;
  let top = event.clientY - 30;
  
  // 检查是否会超出屏幕右侧
  if (left + tooltip.offsetWidth > window.innerWidth - 10) {
    left = event.clientX - tooltip.offsetWidth - 10;
  }
  
  // 检查是否会超出屏幕顶部
  if (top < 10) {
    top = event.clientY + 20;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  
  // 显示提示
  tooltip.style.display = 'block';
  
  // 3秒后隐藏提示
  setTimeout(() => {
    if (tooltip.parentNode) {
      tooltip.style.display = 'none';
    }
  }, 3000);
}

// 国际服跳转链接管理
function initInternationalLink() {
  const internationalLinkBtn = document.getElementById('internationalLinkBtn');
  const internationalModal = document.getElementById('internationalModal');
  const closeInternationalModal = document.getElementById('closeInternationalModal');
  const continueToInternational = document.getElementById('continueToInternational');
  const cancelInternational = document.getElementById('cancelInternational');

  if (!internationalLinkBtn || !internationalModal) return;

  internationalLinkBtn.addEventListener('click', () => {
    internationalModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    internationalModal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  if (closeInternationalModal) closeInternationalModal.addEventListener('click', closeModal);
  if (cancelInternational) cancelInternational.addEventListener('click', closeModal);

  if (continueToInternational) {
    continueToInternational.addEventListener('click', () => {
      window.location.href = 'https://sky-shards.pages.dev/zh';
      closeModal();
    });
  }

  internationalModal.addEventListener('click', (e) => {
    if (e.target === internationalModal) closeModal();
  });
}