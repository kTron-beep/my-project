(() => {
  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#main-nav');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
  }));

  // Main film follows cursor position; touch scrubs by dragging and taps jump.
  const scrub = document.querySelector('#product-scrubber');
  const video = document.querySelector('#scrub-video');
  const progress = document.querySelector('#scrub-progress');
  const timeLabel = document.querySelector('#scrub-time');
  const play = document.querySelector('#scrub-play');
  if (scrub && video) {
    let duration = 0, target = 0, raf = 0, dragging = false, originX = 0, originTime = 0;
    const seek = value => {
      if (!duration) return;
      target = Math.max(0, Math.min(duration - .02, value));
      if (!raf) raf = requestAnimationFrame(() => {
        raf = 0;
        if (video.readyState >= 1 && Math.abs(video.currentTime - target) > .045) video.currentTime = target;
        progress.style.width = `${target / duration * 100}%`;
        const sec = Math.floor(target);
        timeLabel.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      });
    };
    const atPointer = e => {
      const box = scrub.getBoundingClientRect();
      seek(Math.max(0, Math.min(1, (e.clientX - box.left) / box.width)) * duration);
    };
    video.addEventListener('loadedmetadata', () => { duration = video.duration; seek(0); });
    scrub.addEventListener('pointermove', e => {
      if (dragging) {
        const width = scrub.getBoundingClientRect().width;
        seek(originTime + (e.clientX - originX) / width * duration);
      } else if (e.pointerType === 'mouse') atPointer(e);
    });
    scrub.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || e.pointerType === 'mouse') return;
      dragging = true; originX = e.clientX; originTime = target;
      scrub.setPointerCapture(e.pointerId); atPointer(e);
    });
    scrub.addEventListener('pointerup', () => { dragging = false; });
    scrub.addEventListener('pointercancel', () => { dragging = false; });
    scrub.addEventListener('click', e => { if (e.pointerType !== 'mouse' && !e.target.closest('button')) atPointer(e); });
    scrub.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); seek(target + (e.key === 'ArrowRight' ? duration * .025 : -duration * .025));
      }
    });
    play.addEventListener('click', () => {
      if (video.paused) { video.currentTime = target; video.play(); play.innerHTML = 'Ⅱ <b>PAUSE</b>'; }
      else { video.pause(); play.innerHTML = '▶ <b>PLAY</b>'; }
    });
    video.addEventListener('timeupdate', () => {
      if (!video.paused && duration) {
        target = video.currentTime; progress.style.width = `${target / duration * 100}%`;
        const sec = Math.floor(target);
        timeLabel.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      }
    });
    video.addEventListener('ended', () => { play.innerHTML = '▶ <b>PLAY</b>'; });
  }

  document.querySelectorAll('[data-hover-play]').forEach(clip => {
    const host = clip.closest('.hover-film');
    const start = () => { clip.play().catch(() => {}); host.classList.add('playing'); };
    const stop = () => { clip.pause(); host.classList.remove('playing'); };
    host.addEventListener('mouseenter', start);
    host.addEventListener('mouseleave', stop);
    clip.addEventListener('focus', start);
    clip.addEventListener('blur', stop);
    host.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      if (clip.paused) start(); else stop();
    });
  });

  const benefits = [
    ['Consumption<br>visibility.', 'A clearer view of electricity use can help people understand how consumption changes through the day.'],
    ['Spending<br>awareness.', 'Explore how electricity use may relate to spending, making the cost of everyday choices easier to consider.'],
    ['Consumption<br>history.', 'Put readings in context by exploring how usage changes across days, weeks and months.'],
    ['Usage<br>patterns.', 'Recognise recurring rhythms in electricity use and understand what a typical period could look like.'],
    ['Anomaly<br>detection.', 'A future experience could bring unusual consumption patterns to attention for closer inspection.'],
    ['Consumption<br>forecasting.', 'Historical usage may help people explore possible future consumption and plan with more perspective.']
  ];
  let selected = 0;
  const selectBenefit = n => {
    selected = (n + benefits.length) % benefits.length;
    const copy = document.querySelector('.benefit-copy');
    copy.classList.remove('changing');
    void copy.offsetWidth;
    copy.classList.add('changing');
    document.querySelector('#benefit-title').innerHTML = benefits[selected][0];
    document.querySelector('#benefit-description').textContent = benefits[selected][1];
    document.querySelector('#benefit-index').textContent = `CAPABILITY ${String(selected + 1).padStart(2, '0')} / 06`;
    document.querySelectorAll('[data-benefit]').forEach(el => el.classList.toggle('active', Number(el.dataset.benefit) === selected));
  };
  document.querySelectorAll('.benefit-tabs [data-benefit],.hotspot').forEach(el => el.addEventListener('click', () => selectBenefit(Number(el.dataset.benefit))));
  document.querySelector('#benefit-prev').addEventListener('click', () => selectBenefit(selected - 1));
  document.querySelector('#benefit-next').addEventListener('click', () => selectBenefit(selected + 1));

  const month = {
    week: { use: '42.8', spend: '684', pattern: 'Steady', labels: ['MON','TUE','WED','THU','FRI','SAT','SUN'], line: 'M0 180 C60 160 70 80 130 112 S215 188 270 95 S365 72 420 140 S510 155 560 66 S650 123 700 92 S790 172 900 40' },
    month: { use: '168.4', spend: '2,694', pattern: 'Variable', labels: ['WEEK 1','WEEK 2','WEEK 3','WEEK 4'], line: 'M0 150 C95 122 135 75 210 92 S330 165 415 84 S540 60 615 110 S770 94 900 35' }
  };
  document.querySelectorAll('[data-period]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-period]').forEach(b => b.classList.toggle('active', b === btn));
    const d = month[btn.dataset.period], line = document.querySelector('#chart-line');
    const board = document.querySelector('.data-board');
    board.classList.remove('changing');
    void board.offsetWidth;
    board.classList.add('changing');
    animateValue(document.querySelector('#consumption-value'), Number(d.use.replace(',', '')));
    animateValue(document.querySelector('#spend-value'), Number(d.spend.replace(',', '')), true);
    document.querySelector('#pattern-value').textContent = d.pattern;
    line.setAttribute('d', d.line);
    document.querySelector('#chart-area').setAttribute('d', `${d.line} L900 240 L0 240Z`);
    document.querySelector('#chart-labels').innerHTML = d.labels.map(x => `<span>${x}</span>`).join('');
  }));

  function animateValue(node, target, grouped = false) {
    const start = Number(node.textContent.replace(',', '')) || 0;
    const begin = performance.now();
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    const tick = now => {
      const t = Math.min(1, (now - begin) / duration || 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = start + (target - start) * eased;
      node.textContent = grouped ? Math.round(value).toLocaleString('en') : value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Draw each chart the first time it enters view.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    const chartObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('drawn');
      chartObserver.unobserve(entry.target);
    }), { threshold: .2 });
    document.querySelectorAll('.signal svg path,#chart-line').forEach(path => chartObserver.observe(path));
  }

  const links = document.querySelectorAll('.chapter-rail a');
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    links.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}` || (entry.target.classList.contains('hero') && link.hash === '#top')));
  }), { rootMargin: '-40% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(el => revealObserver.observe(el));
  const fadeObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); fadeObserver.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.section-number,.vision-layout,.product-intro,.scrub-card,.product-facts,.benefits-heading,.benefit-explorer,.platform-head,.data-board,.connection-heading,.story-films,.flowline,.about-layout,.team-heading,.founders,.contact-layout').forEach(el => fadeObserver.observe(el));
  document.querySelectorAll('.story-films article,.product-facts>div,.principles>div').forEach((el, index) => el.style.setProperty('--stagger', `${index * 90}ms`));
  if (reduceMotion) document.querySelectorAll('.section-number,.vision-layout,.product-intro,.scrub-card,.product-facts,.benefits-heading,.benefit-explorer,.platform-head,.data-board,.connection-heading,.story-films,.flowline,.about-layout,.team-heading,.founders,.contact-layout').forEach(el => el.classList.add('visible'));
})();
