import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import { newDecisionLogGenerator } from './generator';
import { NewDecisionLogGeneratorSchema } from './schema';

describe('new-decision-log generator', () => {
  let tree: Tree;
  const options: NewDecisionLogGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await newDecisionLogGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});
