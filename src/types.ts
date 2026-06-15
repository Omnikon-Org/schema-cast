export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'uuid'
  | 'email'
  | 'url'
  | 'enum'
  | 'object'
  | 'array';

export interface BaseFieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  primary?: boolean;
}

export interface StringField extends BaseFieldDefinition {
  type: 'string' | 'uuid' | 'email' | 'url';
  default?: string;
}

export interface NumberField extends BaseFieldDefinition {
  type: 'number';
  default?: number;
}

export interface BooleanField extends BaseFieldDefinition {
  type: 'boolean';
  default?: boolean;
}

export interface DateField extends BaseFieldDefinition {
  type: 'date';
}

export interface EnumField extends BaseFieldDefinition {
  type: 'enum';
  values: string[];
  default?: string;
}

export interface ObjectField extends BaseFieldDefinition {
  type: 'object';
  fields: FieldDefinition[];
}

export interface ArrayField extends BaseFieldDefinition {
  type: 'array';
  items: Omit<FieldDefinition, 'name'>;
}

export type FieldDefinition =
  | StringField
  | NumberField
  | BooleanField
  | DateField
  | EnumField
  | ObjectField
  | ArrayField;

export interface SchemaDefinition {
  name: string;
  fields: FieldDefinition[];
}
