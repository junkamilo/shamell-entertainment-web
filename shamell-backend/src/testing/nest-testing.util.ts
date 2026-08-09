import {
  Test,
  type TestingModule,
  type TestingModuleBuilder,
} from '@nestjs/testing';

/** Compile a Nest testing module from a builder configurator. */
export async function compileTestingModule(
  configure: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<TestingModule> {
  const builder = configure(Test.createTestingModule({}));
  return builder.compile();
}
