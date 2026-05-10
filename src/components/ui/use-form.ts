"use client"

import * as React from "react"
import { useForm as useRhfForm, type FieldValues, type Path } from 'react-hook-form';

// ============================================================
// useForm hook (AntD-compatible wrapper around react-hook-form)
// ============================================================
interface UseFormReturn<T extends FieldValues = FieldValues> {
  getValues: () => T;
  setFieldsValue: (values: Partial<T>) => void;
  validateFields: () => Promise<T>;
  resetFields: () => void;
  submit: () => void;
}

function useForm<T extends FieldValues = FieldValues>(): [T, UseFormReturn<T>] {
  const methods = useRhfForm<T>();
  const form: UseFormReturn<T> = {
    getValues: () => methods.getValues() as T,
    setFieldsValue: (values) => {
      Object.entries(values).forEach(([key, value]) => {
        methods.setValue(key as Path<T>, value as T[Path<T>]);
      });
    },
    validateFields: async () => {
      try {
        const isValid = await methods.trigger();
        if (isValid) return methods.getValues() as T;
        throw new Error('validation failed');
      } catch {
        throw new Error('validation failed');
      }
    },
    resetFields: () => methods.reset(),
    submit: () => methods.handleSubmit(() => {})(),
  };
  return [{} as T, form];
}

export { useForm, type UseFormReturn }
