/**
 * TimSort 算法
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(n)
 * 
 * 特点：
 * - 工业级排序算法，Python和Java的默认排序算法
 * - 结合了归并排序和插入排序
 * - 利用数据中已有的有序序列（run）
 * - 稳定排序
 */

import type { AlgorithmDefinition } from '../../types';

export const timsortDefinition: AlgorithmDefinition = {
  id: 'timsort',
  name: 'TimSort',
  category: 'sorting',
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(n)',
  description: '工业级排序算法，Python和Java的默认排序算法。结合归并排序和插入排序，利用数据中已有的有序序列。',
  code: `function timsort(arr) {
  const MIN_RUN = 32;
  const n = arr.length;
  
  // 1. 将数组分成小run，每个run使用插入排序
  for (let i = 0; i < n; i += MIN_RUN) {
    insertionSort(arr, i, Math.min(i + MIN_RUN - 1, n - 1));
  }
  
  // 2. 使用归并排序合并run
  for (let size = MIN_RUN; size < n; size *= 2) {
    for (let left = 0; left < n; left += 2 * size) {
      const mid = left + size - 1;
      const right = Math.min(left + 2 * size - 1, n - 1);
      
      if (mid < right) {
        merge(arr, left, mid, right);
      }
    }
  }
  
  return arr;
}

// 插入排序（用于小run）
function insertionSort(arr, left, right) {
  for (let i = left + 1; i <= right; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= left && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
}

// 归并两个有序子数组
function merge(arr, left, mid, right) {
  const leftArr = arr.slice(left, mid + 1);
  const rightArr = arr.slice(mid + 1, right + 1);
  
  let i = 0, j = 0, k = left;
  
  while (i < leftArr.length && j < rightArr.length) {
    if (leftArr[i] <= rightArr[j]) {
      arr[k++] = leftArr[i++];
    } else {
      arr[k++] = rightArr[j++];
    }
  }
  
  while (i < leftArr.length) {
    arr[k++] = leftArr[i++];
  }
  
  while (j < rightArr.length) {
    arr[k++] = rightArr[j++];
  }
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 32, min: 10, max: 100 }
  ]
};

export const timsortTemplates = [
  {
    language: 'python',
    label: 'Python',
    code: `# Python的sort()就是TimSort的实现
def timsort(arr):
    MIN_RUN = 32
    n = len(arr)
    
    # 对小的run使用插入排序
    for start in range(0, n, MIN_RUN):
        end = min(start + MIN_RUN - 1, n - 1)
        insertion_sort(arr, start, end)
    
    # 合并runs
    size = MIN_RUN
    while size < n:
        for left in range(0, n, 2 * size):
            mid = min(left + size - 1, n - 1)
            right = min(left + 2 * size - 1, n - 1)
            if mid < right:
                merge(arr, left, mid, right)
        size *= 2
    return arr

def insertion_sort(arr, left, right):
    for i in range(left + 1, right + 1):
        key = arr[i]
        j = i - 1
        while j >= left and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key

def merge(arr, left, mid, right):
    left_arr = arr[left:mid + 1]
    right_arr = arr[mid + 1:right + 1]
    i = j = 0
    k = left
    while i < len(left_arr) and j < len(right_arr):
        if left_arr[i] <= right_arr[j]:
            arr[k] = left_arr[i]
            i += 1
        else:
            arr[k] = right_arr[j]
            j += 1
        k += 1
    while i < len(left_arr):
        arr[k] = left_arr[i]
        i += 1
        k += 1
    while j < len(right_arr):
        arr[k] = right_arr[j]
        j += 1
        k += 1`
  },
  {
    language: 'java',
    label: 'Java',
    code: `// Java的Arrays.sort()使用TimSort
import java.util.Arrays;

public class TimSort {
    private static final int MIN_RUN = 32;
    
    public static void timSort(int[] arr) {
        int n = arr.length;
        
        // 对小的run使用插入排序
        for (int i = 0; i < n; i += MIN_RUN) {
            insertionSort(arr, i, Math.min(i + MIN_RUN - 1, n - 1));
        }
        
        // 合并runs
        for (int size = MIN_RUN; size < n; size *= 2) {
            for (int left = 0; left < n; left += 2 * size) {
                int mid = left + size - 1;
                int right = Math.min(left + 2 * size - 1, n - 1);
                if (mid < right) {
                    merge(arr, left, mid, right);
                }
            }
        }
    }
    
    private static void insertionSort(int[] arr, int left, int right) {
        for (int i = left + 1; i <= right; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= left && arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            }
            arr[j + 1] = key;
        }
    }
    
    private static void merge(int[] arr, int left, int mid, int right) {
        int[] leftArr = Arrays.copyOfRange(arr, left, mid + 1);
        int[] rightArr = Arrays.copyOfRange(arr, mid + 1, right + 1);
        
        int i = 0, j = 0, k = left;
        while (i < leftArr.length && j < rightArr.length) {
            arr[k++] = (leftArr[i] <= rightArr[j]) ? leftArr[i++] : rightArr[j++];
        }
        while (i < leftArr.length) arr[k++] = leftArr[i++];
        while (j < rightArr.length) arr[k++] = rightArr[j++];
    }
}`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function timsort(arr) {
    const MIN_RUN = 32;
    const n = arr.length;
    
    // 对小的run使用插入排序
    for (let i = 0; i < n; i += MIN_RUN) {
        insertionSort(arr, i, Math.min(i + MIN_RUN - 1, n - 1));
    }
    
    // 合并runs
    for (let size = MIN_RUN; size < n; size *= 2) {
        for (let left = 0; left < n; left += 2 * size) {
            const mid = left + size - 1;
            const right = Math.min(left + 2 * size - 1, n - 1);
            if (mid < right) {
                merge(arr, left, mid, right);
            }
        }
    }
    return arr;
}

function insertionSort(arr, left, right) {
    for (let i = left + 1; i <= right; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= left && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

function merge(arr, left, mid, right) {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
        arr[k++] = leftArr[i] <= rightArr[j] ? leftArr[i++] : rightArr[j++];
    }
    while (i < leftArr.length) arr[k++] = leftArr[i++];
    while (j < rightArr.length) arr[k++] = rightArr[j++];
}`
  }
];
