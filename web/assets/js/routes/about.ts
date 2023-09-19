import { gsap } from 'gsap';
import { charming } from '../utils/charming';
const aboutView = {
  namespace: 'about',
  beforeEnter() {},
  afterEnter() {}
};

const webglMove = function (app: any) {
  app.call('changeStatus', ['init'], 'webgl');
  app.call('moveScene', '', 'webgl');
  app.call('appear', '', 'webgl');
};
const onEnter = function (next?: any) {
  const container = next?.container ?? document;
  DOM.titles = [...container.querySelectorAll('.js-title')];
  gsap.set(container.querySelectorAll('.js-title'), { autoAlpha: 1 });
  gsap.set('#js-background', { transformOrigin: 'left' });

  DOM.titles.forEach((title: Element) => {
    charming(title, {
      tagName: 'span',
      type: 'word',
      nesting: 1,
      classPrefix: 'word word'
    });
    charming(title, {
      tagName: 'span',
      type: 'letter',
      nesting: 2,
      classPrefix: 'char char'
    });
  });

  gsap.to('#js-background', {
    autoAlpha: 1,
    x: '50%',
    scaleY: 1,
    scaleX: 1.1,
    duration: 1
  });
  gsap.to(container.querySelectorAll('.js-title .char > span'), {
    y: '0%',
    stagger: 0.04,
    duration: 0.4,
    delay: 0.7
  });
  gsap.to(container.querySelectorAll('.js-content'), {
    autoAlpha: 1,
    duration: 1,
    delay: 0.8
  });
};

// DOM init
const DOM: Record<string, any> = {};

const aboutTransition = (app: any) => {
  return [
    {
      name: 'about-transition-home',
      to: {
        namespace: ['about']
      },
      from: {
        namespace: ['home']
      },
      leave({ current }: { current: any }) {
        const prom = new Promise<void>((resolve) => {
          const titles = current.container.querySelectorAll(
            '.js-title .char > span'
          );
          const subtitles = current.container.querySelectorAll('.js-subtitle');
          const content = current.container.querySelectorAll('.js-content');
          if (titles)
            gsap.to(titles, { y: '100%', autoAlpha: 0, duration: 0.4 });
          if (subtitles) gsap.to(subtitles, { autoAlpha: 0, duration: 0.4 });
          if (content)
            gsap.to(content, {
              autoAlpha: 0,
              duration: 0.4,
              onComplete: () => resolve()
            });
        });
        return Promise.all([prom]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
      }
    },
    {
      name: 'about-transition-dashboard',
      sync: true,
      from: {
        namespace: ['dashboard']
      },
      to: {
        namespace: ['about']
      },

      leave({ current }: { current: any }) {
        const prom = new Promise<void>((resolve) => {
          const dashboardheader = current.container.querySelector(
            '.js-dashboardheader'
          );
          const dashboard = current.container.querySelector('.js-dashboard');
          const dashboardArticle = current.container.querySelectorAll(
            '.js-dashboard article'
          );
          gsap.to(dashboardheader, { autoAlpha: 0, duration: 0.4 });
          gsap.to(dashboard, { '--sidepane': '100%' });
          gsap.to(dashboardArticle, {
            autoAlpha: 0,
            duration: 0.4,
            onComplete: () => resolve()
          });
        });
        return Promise.all([prom]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
        webglMove(app);
      }
    },
    {
      name: 'about-transition-play',
      to: {
        namespace: ['about']
      },
      from: {
        namespace: ['play']
      },
      leave() {
        return Promise.all([
          app.call('disappear', '', 'Gameoptions'),
          app.call('disappear', '', 'Gameplayers', 'me'),
          app.call('disappear', '', 'Gameplayers', 'rival'),
          app.call('disappear', '', 'Gamecontrols')
        ]);
      },
      enter({ next }: { next: any }) {
        onEnter(next);
        webglMove(app);
      }
    },
    {
      to: {
        namespace: ['about']
      },

      once() {
        onEnter();
      }
    }
  ];
};

export { aboutView, aboutTransition };
