import 'reflect-metadata';
import { SkipTransform, SKIP_TRANSFORM_KEY } from './skip-transform.decorator';

describe('SkipTransform', () => {
  it('definit le metadata SKIP_TRANSFORM_KEY a true sur une classe', () => {
    @SkipTransform()
    class TestController {}

    const value = Reflect.getMetadata(
      SKIP_TRANSFORM_KEY,
      TestController,
    ) as boolean;
    expect(value).toBe(true);
  });

  it('definit le metadata SKIP_TRANSFORM_KEY a true sur une methode', () => {
    class TestController {
      @SkipTransform()
      check() {
        return {};
      }
    }

    const fn = Object.getOwnPropertyDescriptor(
      TestController.prototype,
      'check',
    )?.value as object;
    const value = Reflect.getMetadata(SKIP_TRANSFORM_KEY, fn) as boolean;
    expect(value).toBe(true);
  });

  it('SKIP_TRANSFORM_KEY vaut skipTransform', () => {
    expect(SKIP_TRANSFORM_KEY).toBe('skipTransform');
  });
});
