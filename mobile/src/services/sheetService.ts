export interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  category: string;
  subCategory: string;
  description: string;
  isEssential: boolean;
}

export interface Budget {
  category: string;
  budget: number;
}

export interface SheetData {
  transactions: Transaction[];
  budgets: Budget[];
}

export const getLocalISOString = (date: Date = new Date()): string => {
  const pad = (num: number) => (num < 10 ? '0' : '') + num;
  const padMs = (num: number) => {
    if (num < 10) return '00' + num;
    if (num < 100) return '0' + num;
    return num.toString();
  };
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    '.' + padMs(date.getMilliseconds());
};

export const sheetService = {
  /**
   * Test the connection to the Google Apps Script Web App
   */
  testConnection: async (url: string): Promise<boolean> => {
    console.log('\n--- [DEBUG: sheetService.testConnection] ---');
    console.log('Target URL:', url);
    try {
      const fetchUrl = `${url}?action=getData`;
      console.log('Sending GET request to:', fetchUrl);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      console.log('HTTP Status:', response.status, response.statusText);
      const rawText = await response.text();
      console.log('Raw Response length:', rawText.length);
      console.log('Raw Response Preview (first 500 chars):\n', rawText.substring(0, 500));
      
      if (!response.ok) {
        console.warn('HTTP Response was not OK (not in 200-299 range)');
        return false;
      }
      
      try {
        const resJson = JSON.parse(rawText);
        console.log('JSON Parse succeeded. Response status:', resJson.status);
        return resJson.status === 'success';
      } catch (jsonErr) {
        console.error('JSON Parse failed. Response is NOT valid JSON. (It is likely HTML)');
        return false;
      }
    } catch (e: any) {
      console.error('Network/Fetch failure:', e.message || e);
      return false;
    }
  },

  /**
   * Fetch all transactions and budgets
   */
  fetchData: async (url: string): Promise<SheetData> => {
    console.log('\n--- [DEBUG: sheetService.fetchData] ---');
    const fetchUrl = `${url}?action=getData`;
    console.log('Sending GET request to:', fetchUrl);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('HTTP Status:', response.status);
    const rawText = await response.text();
    console.log('Raw Response Preview (first 300 chars):\n', rawText.substring(0, 300));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data from sheet: ${response.status}`);
    }
    
    const resJson = JSON.parse(rawText);
    if (resJson.status !== 'success') {
      throw new Error(resJson.message || 'Unknown error fetching data');
    }
    return resJson.data;
  },

  /**
   * Add a new transaction
   */
  addTransaction: async (
    url: string,
    amount: number,
    category: string,
    subCategory?: string,
    description?: string,
    isEssential?: boolean
  ): Promise<string> => {
    console.log('\n--- [DEBUG: sheetService.addTransaction] ---');
    console.log('Target URL:', url);
    const payload = {
      action: 'addTransaction',
      amount,
      category,
      subCategory: subCategory || '',
      description: description || '',
      isEssential: isEssential !== undefined ? isEssential : true,
      timestamp: getLocalISOString(),
    };
    console.log('Sending POST Payload:', JSON.stringify(payload));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('HTTP Status:', response.status);
    const rawText = await response.text();
    console.log('Raw Response Preview:\n', rawText.substring(0, 300));

    if (!response.ok) {
      throw new Error(`Failed to add transaction: ${response.status}`);
    }
    const resJson = JSON.parse(rawText);
    if (resJson.status !== 'success') {
      throw new Error(resJson.message || 'Failed to add transaction');
    }
    return resJson.id;
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (url: string, id: string): Promise<boolean> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteTransaction',
        id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete transaction: ${response.status}`);
    }
    const resJson = await response.json();
    if (resJson.status !== 'success') {
      throw new Error(resJson.message || 'Failed to delete transaction');
    }
    return true;
  },

  /**
   * Create or update category budget
   */
  saveCategory: async (url: string, category: string, budget: number): Promise<boolean> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveCategory',
        category,
        budget,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save category: ${response.status}`);
    }
    const resJson = await response.json();
    if (resJson.status !== 'success') {
      throw new Error(resJson.message || 'Failed to save category');
    }
    return true;
  },

  /**
   * Delete category
   */
  deleteCategory: async (url: string, category: string): Promise<boolean> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'deleteCategory',
        category,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete category: ${response.status}`);
    }
    const resJson = await response.json();
    if (resJson.status !== 'success') {
      throw new Error(resJson.message || 'Failed to delete category');
    }
    return true;
  },
};
