import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import yaml from 'js-yaml';

export const createSanitizeResource = () => {
  return createTemplateAction({
    id: 'cnoe:utils:sanitize',
    schema: {
      input: {
        document: z => z.string().describe('The document to be sanitized'),
      },
      output: {
        sanitized: z => z.string().describe('The sanitized yaml string'),
      },
    },
    async handler(ctx) {
      const obj = yaml.load(ctx.input.document);
      ctx.output('sanitized', yaml.dump(removeEmptyObjects(obj)));
    },
  });
};

function removeEmptyObjects(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];
      const newValue = removeEmptyObjects(value);
      if (
        !(
          newValue === null ||
          newValue === undefined ||
          (typeof newValue === 'object' && Object.keys(newValue).length === 0)
        )
      ) {
        newObj[key] = newValue;
      }
    }
  }
  return newObj;
}
