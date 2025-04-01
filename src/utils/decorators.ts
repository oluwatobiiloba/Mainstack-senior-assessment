import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsValidInteger(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidInteger',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const num = parseInt(value, 10);
          return !isNaN(num) && Number.isInteger(num);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid integer`;
        }
      }
    });
  };
}