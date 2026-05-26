export const APPS_SCRIPT_TEMPLATE = `/**
 * Google Sheets Database Proxy for FinTrack
 * 
 * Instructions:
 * 1. Create a Google Sheet.
 * 2. Click on "Extensions" -> "Apps Script".
 * 3. Delete any code in the editor, and paste this script.
 * 4. Click "Save" (disk icon).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Select type "Web app".
 * 7. Set:
 *    - Description: Personal Finance Tracker API
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy". Copy the "Web app URL" and paste it in the App settings.
 */

function doGet(e) {
  try {
    const action = e.parameter.action || 'getData';
    initializeSheets();
    
    if (action === 'getData') {
      const data = fetchAllData();
      return jsonResponse({ status: 'success', data: data });
    }
    
    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    initializeSheets();
    if (!e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'Missing post body data' });
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    if (!action) {
      return jsonResponse({ status: 'error', message: 'Missing action parameter in payload' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'addTransaction') {
      const sheet = ss.getSheetByName('Transactions');
      const id = Utilities.getUuid();
      const amount = Number(payload.amount);
      const timestamp = payload.timestamp || new Date().toISOString();
      const category = payload.category || 'Uncategorized';
      const subCategory = payload.subCategory || '';
      const description = payload.description || '';
      
      sheet.appendRow([id, amount, timestamp, category, subCategory, description]);
      return jsonResponse({ status: 'success', message: 'Transaction added', id: id });
    }
    
    if (action === 'deleteTransaction') {
      const sheet = ss.getSheetByName('Transactions');
      const id = payload.id;
      if (!id) return jsonResponse({ status: 'error', message: 'Missing transaction ID' });
      
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === id) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        sheet.deleteRow(foundIndex);
        return jsonResponse({ status: 'success', message: 'Transaction deleted' });
      } else {
        return jsonResponse({ status: 'error', message: 'Transaction ID not found' });
      }
    }
    
    if (action === 'saveCategory') {
      const sheet = ss.getSheetByName('Budgets');
      const category = payload.category;
      const budget = Number(payload.budget) || 0;
      
      if (!category) return jsonResponse({ status: 'error', message: 'Missing category name' });
      
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toLowerCase() === category.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        sheet.getRange(foundIndex, 2).setValue(budget);
        return jsonResponse({ status: 'success', message: 'Category budget updated' });
      } else {
        sheet.appendRow([category, budget]);
        return jsonResponse({ status: 'success', message: 'Category added' });
      }
    }
    
    if (action === 'deleteCategory') {
      const sheet = ss.getSheetByName('Budgets');
      const category = payload.category;
      if (!category) return jsonResponse({ status: 'error', message: 'Missing category name' });
      
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0].toLowerCase() === category.toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        sheet.deleteRow(foundIndex);
        return jsonResponse({ status: 'success', message: 'Category deleted' });
      } else {
        return jsonResponse({ status: 'error', message: 'Category not found' });
      }
    }
    
    return jsonResponse({ status: 'error', message: 'Unknown post action: ' + action });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let transSheet = ss.getSheetByName('Transactions');
  if (!transSheet) {
    transSheet = ss.insertSheet('Transactions');
    transSheet.appendRow(['id', 'amount', 'timestamp', 'category', 'subCategory', 'description']);
  }
  
  let budgetSheet = ss.getSheetByName('Budgets');
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet('Budgets');
    budgetSheet.appendRow(['category', 'budget']);
    budgetSheet.appendRow(['Food', 500]);
    budgetSheet.appendRow(['Transport', 150]);
    budgetSheet.appendRow(['Entertainment', 200]);
    budgetSheet.appendRow(['Shopping', 300]);
    budgetSheet.appendRow(['Bills', 1000]);
  }
}

function fetchAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const transSheet = ss.getSheetByName('Transactions');
  const transData = transSheet.getDataRange().getValues();
  const transactions = [];
  for (let i = 1; i < transData.length; i++) {
    transactions.push({
      id: transData[i][0],
      amount: Number(transData[i][1]),
      timestamp: transData[i][2],
      category: transData[i][3],
      subCategory: transData[i][4],
      description: transData[i][5]
    });
  }
  
  const budgetSheet = ss.getSheetByName('Budgets');
  const budgetData = budgetSheet.getDataRange().getValues();
  const budgets = [];
  for (let i = 1; i < budgetData.length; i++) {
    budgets.push({
      category: budgetData[i][0],
      budget: Number(budgetData[i][1])
    });
  }
  
  return {
    transactions: transactions.reverse(),
    budgets: budgets
  };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
