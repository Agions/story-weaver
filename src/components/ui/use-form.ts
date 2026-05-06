"use client"

import * as React from "react"
import { useForm as useRhfForm } from 'react-hook-form';

// ============================================================
// useForm hook (AntD-compatible wrapper around react-hook-form)
// ============================================================
interface UseFormReturn {
  getValues: () => any;
  setFieldsValue: (values: any) => void;
  validateFields: () => Promise<any>;
  resetFields: () => void;
  submit: () => void;
}

function useForm(): [any, UseFormReturn] {
  const methods = useRhfForm();
  const form: UseFormReturn = {
    getValues: () => methods.getValues(),
    setFieldsValue: (values) => methods.reset(values as any),
    validateFields: async () => {
      try {
        const values = await methods.trigger();
        if (values) return methods.getValues();
        throw new Error('validation failed');
      } catch {
        throw new Error('validation failed');
      }
    },
    resetFields: () => methods.reset(),
    submit: () => methods.handleSubmit(() => {})(),
  };
  return [{}, form];
}

export { useForm, type UseFormReturn }
