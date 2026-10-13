import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { RouteName } from '@/app/constants/route-names';
import { useSessionStore } from '@/app/stores/session.store';
import HomeView from '../HomeView.vue';

const user = { id: '1', email: 'john@example.com', name: 'John' };

describe('HomeView', () => {
  let router: ReturnType<typeof createRouter>;

  const mountView = async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: RouteName.Home, component: HomeView },
        { path: '/sign-in', name: RouteName.SignIn, component: { template: '<div />' } },
      ],
    });
    await router.push('/');
    return mount(HomeView, { global: { plugins: [router] } });
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    useSessionStore().$patch({ user });
  });

  it('shows the required welcome text', async () => {
    const wrapper = await mountView();

    expect(wrapper.text()).toContain('Welcome to the application.');
  });

  it('signs out and returns to the sign-in page', async () => {
    const session = useSessionStore();
    const signOut = vi.spyOn(session, 'signOut').mockResolvedValue();
    const wrapper = await mountView();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(signOut).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.name).toBe(RouteName.SignIn);
  });
});
