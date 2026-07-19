import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import PlantDashboard from './PlantDashboard';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../components/PageLoader', () => ({
  __esModule: true,
  default: ({ children, loading }) => <div>{loading ? 'loading' : children}</div>,
}));

jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 100, getHeight: () => 100 } },
    addImage: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  })),
}));

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    height: 100,
    width: 100,
    toDataURL: () => 'data:image/png;base64,abc',
  }),
}));

jest.mock('exceljs', () => ({
  __esModule: true,
  default: {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue({
        addRow: jest.fn(),
        getRow: jest.fn().mockReturnValue({ font: {}, getCell: jest.fn() }),
        columns: [],
        getColumn: jest.fn(),
      }),
      xlsx: { writeBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)) },
    })),
  },
}));

describe('PlantDashboard edit access', () => {
  beforeEach(() => {
    localStorage.clear();
    axios.get.mockReset();
    axios.put.mockReset();
    axios.get.mockResolvedValue({ data: [] });
  });

  test('disables edit mode button for non-superadmin users', async () => {
    localStorage.setItem('userInfo', JSON.stringify({ role: 'supervisor' }));

    render(<PlantDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit data/i })).toBeDisabled();
    });
  });

  test('allows edit mode button for superadmin users', async () => {
    localStorage.setItem('userInfo', JSON.stringify({ role: 'superadmin' }));

    render(<PlantDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit data/i })).not.toBeDisabled();
    });
  });

  test('allows edit mode button for the specified admin email', async () => {
    localStorage.setItem('userInfo', JSON.stringify({ email: 'maheshadmin@gmail.com', role: 'admin' }));

    render(<PlantDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit data/i })).not.toBeDisabled();
    });
  });
});
