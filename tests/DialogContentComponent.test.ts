import { DialogContentComponent } from '../src/components/DialogContentComponent';
import { ComponentRegistry } from '../src/ecs/ComponentRegistry';

describe('DialogContentComponent', () => {
  it('stores authored dialog content and exposes its registry ID', () => {
    const content = new DialogContentComponent({
      title: 'Greeting',
      text: 'Welcome to town.',
    });

    expect(content.title).toBe('Greeting');
    expect(content.text).toBe('Welcome to town.');
    expect(content.mask).toBe(ComponentRegistry.getId(DialogContentComponent));
  });
});
