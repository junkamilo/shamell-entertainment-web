import { withTemplateRegenerationLock } from './class-session-regeneration.lock';

describe('withTemplateRegenerationLock', () => {
  it('runs tasks for the same templateId sequentially', async () => {
    const order: number[] = [];
    const templateId = 'template-a';

    const first = withTemplateRegenerationLock(templateId, async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push(1);
    });
    const second = withTemplateRegenerationLock(templateId, () => {
      order.push(2);
      return Promise.resolve();
    });

    await Promise.all([first, second]);
    expect(order).toEqual([1, 2]);
  });

  it('allows parallel tasks for different templateIds', async () => {
    let aDone = false;
    const a = withTemplateRegenerationLock('t1', async () => {
      await new Promise((r) => setTimeout(r, 40));
      aDone = true;
    });
    let bStartedBeforeADone = false;
    const b = withTemplateRegenerationLock('t2', () => {
      bStartedBeforeADone = !aDone;
      return Promise.resolve();
    });
    await Promise.all([a, b]);
    expect(bStartedBeforeADone).toBe(true);
  });
});
