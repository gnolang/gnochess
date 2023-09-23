import { gsap } from 'gsap';

const playView = {
  namespace: 'play',
  beforeEnter() {},
  afterEnter() {},
  beforeLeave() {}
};

const playTransition = (app: any) => {
  return [
    {
      name: 'play-transition',
      sync: true,
      to: {
        namespace: ['play']
      },
      leave({ current }: { current: any }) {
        return new Promise<void>((resolve) => {
          const titles = current.container.querySelectorAll(
            '.js-title .char > span'
          );
          const subtitles = current.container.querySelectorAll('.js-subtitle');
          const content = current.container.querySelectorAll('.js-content');
          const banner = current.container.querySelectorAll('.js-banner');
          gsap.to(titles, { y: '100%', autoAlpha: 0, duration: 0.4 });
          gsap.to(subtitles, { autoAlpha: 0, duration: 0.4 });
          gsap.to(banner, { autoAlpha: 0, duration: 0.4 });
          gsap.to(content, {
            autoAlpha: 0,
            duration: 0.4,
            onComplete: () => resolve()
          });
        });
      },
      enter() {
        gsap.to('#js-background', { scaleX: 1, duration: 1.2 });
        gsap.to('#js-background', { x: 0, autoAlpha: 1 });
        app.call('changeStatus', ['pending'], 'webgl');
        app.call('moveScene', '', 'webgl');
      }
    },
    {
      name: 'play-transition-dashboard',
      from: {
        namespace: ['dashboard']
      },
      to: {
        namespace: ['play']
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
      enter() {
        app.call('appear', '', 'webgl');

        app.call('changeStatus', ['pending'], 'webgl');
        app.call('moveScene', '', 'webgl');

        gsap.set('#js-background', { x: 0, scaleX: 1 });
        gsap.to('#js-background', { autoAlpha: 1 });
      }
    },
    {
      to: {
        namespace: ['play']
      },
      once() {
        app.call('changeStatus', ['pending'], 'webgl');

        gsap.set('#js-background', { x: 0, scaleX: 1 });
        gsap.to('#js-background', { autoAlpha: 1 });
      }
    }
  ];
};

export { playView, playTransition };
