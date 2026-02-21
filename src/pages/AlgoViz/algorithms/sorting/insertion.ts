/**
 * 插入排序算法
 * 时间复杂度: 最好 O(n), 平均 O(n²), 最坏 O(n²)
 * 空间复杂度: O(1)
 * 
 * 特点：
 * - 稳定排序
 * - 对于小规模数据或基本有序的数据效率很高
 * - 在线算法（可以逐个处理输入）
 */

import type { AlgorithmDefinition } from '../../types';

export const insertionSortDefinition: AlgorithmDefinition = {
  id: 'insertion',
  name: '插入排序',
  category: 'sorting',
  timeComplexity: 'O(n²)',
  spaceComplexity: 'O(1)',
  description: '将未排序元素逐个插入到已排序部分的正确位置。对于小规模或基本有序的数据非常高效，是稳定排序。',
  code: `function insertionSort(arr) {
  const n = arr.length;
  
  // 从第二个元素开始遍历
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    
    // 将大于key的元素向后移动
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    
    // 插入到正确位置
    arr[j + 1] = key;
  }
  
  return arr;
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 15, min: 5, max: 50 },
    { name: 'range', type: 'number', default: 100, min: 10, max: 1000 }
  ]
};

// 代码模板
export const insertionSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void insertionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void insertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
    return arr;
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `func insertionSort(arr []int) {
    n := len(arr)
    for i := 1; i < n; i++ {
        key := arr[i]
        j := i - 1
        for j >= 0 && arr[j] > key {
            arr[j+1] = arr[j]
            j--
        }
        arr[j+1] = key
    }
}`
  },
  {
    language: 'rust',
    label: 'Rust',
    code: `fn insertion_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 1..n {
        let key = arr[i];
        let mut j = i as i32 - 1;
        while j >= 0 && arr[j as usize] > key {
            arr[(j + 1) as usize] = arr[j as usize];
            j -= 1;
        }
        arr[(j + 1) as usize] = key;
    }
}`
  },
  {
    language: 'csharp',
    label: 'C#',
    code: `public static void InsertionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
  },
  {
    language: 'matlab',
    label: 'MatLab',
    code: `function arr = insertionSort(arr)
    n = length(arr);
    for i = 2:n
        key = arr(i);
        j = i - 1;
        while j >= 1 && arr(j) > key
            arr(j + 1) = arr(j);
            j = j - 1;
        end
        arr(j + 1) = key;
    end
end`
  }
];
