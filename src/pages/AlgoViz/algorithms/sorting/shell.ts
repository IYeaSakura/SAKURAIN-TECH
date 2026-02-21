/**
 * 希尔排序算法 (Shell Sort)
 * 时间复杂度: 取决于增量序列，约为 O(n^1.3) 到 O(n²)
 * 空间复杂度: O(1)
 *
 * 特点：
 * - 插入排序的改进版
 * - 通过设置增量序列，让相距较远的元素先进行比较和移动
 * - 最后一轮增量为1，即普通的插入排序
 * - 不稳定排序
 */

import type { AlgorithmDefinition } from '../../types';

export const shellSortDefinition: AlgorithmDefinition = {
  id: 'shell',
  name: '希尔排序',
  category: 'sorting',
  timeComplexity: 'O(n^1.3) ~ O(n²)',
  spaceComplexity: 'O(1)',
  description: '插入排序的改进版，通过设置增量序列让相距较远的元素先进行比较，最后一轮进行普通插入排序。',
  code: `function shellSort(arr) {
  const n = arr.length;

  // 初始化增量，使用希尔增量序列：n/2, n/4, ..., 1
  let gap = Math.floor(n / 2);

  while (gap > 0) {
    // 对当前增量进行插入排序
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;

      // 插入排序，间隔为gap
      while (j >= gap && arr[j - gap] > temp) {
        arr[j] = arr[j - gap];
        j -= gap;
      }

      arr[j] = temp;
    }

    // 缩小增量
    gap = Math.floor(gap / 2);
  }

  return arr;
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 20, min: 5, max: 50 }
  ]
};

// 代码模板
export const shellSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void shellSort(int arr[], int n) {
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void shellSort(vector<int>& arr) {
    int n = arr.size();
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void shellSort(int[] arr) {
    int n = arr.length;
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def shell_sort(arr):
    n = len(arr)
    gap = n // 2
    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function shellSort(arr) {
    const n = arr.length;
    let gap = Math.floor(n / 2);
    while (gap > 0) {
        for (let i = gap; i < n; i++) {
            let temp = arr[i];
            let j = i;
            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
        gap = Math.floor(gap / 2);
    }
    return arr;
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `func shellSort(arr []int) {
    n := len(arr)
    for gap := n / 2; gap > 0; gap /= 2 {
        for i := gap; i < n; i++ {
            temp := arr[i]
            j := i
            for j >= gap && arr[j-gap] > temp {
                arr[j] = arr[j-gap]
                j -= gap
            }
            arr[j] = temp
        }
    }
}`
  },
  {
    language: 'rust',
    label: 'Rust',
    code: `fn shell_sort(arr: &mut [i32]) {
    let n = arr.len();
    let mut gap = n / 2;
    while gap > 0 {
        for i in gap..n {
            let temp = arr[i];
            let mut j = i;
            while j >= gap && arr[j - gap] > temp {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
        gap /= 2;
    }
}`
  },
  {
    language: 'csharp',
    label: 'C#',
    code: `public static void ShellSort(int[] arr) {
    int n = arr.Length;
    for (int gap = n / 2; gap > 0; gap /= 2) {
        for (int i = gap; i < n; i++) {
            int temp = arr[i];
            int j;
            for (j = i; j >= gap && arr[j - gap] > temp; j -= gap) {
                arr[j] = arr[j - gap];
            }
            arr[j] = temp;
        }
    }
}`
  },
  {
    language: 'matlab',
    label: 'MatLab',
    code: `function arr = shellSort(arr)
    n = length(arr);
    gap = floor(n / 2);
    while gap > 0
        for i = gap+1:n
            temp = arr(i);
            j = i;
            while j > gap && arr(j - gap) > temp
                arr(j) = arr(j - gap);
                j = j - gap;
            end
            arr(j) = temp;
        end
        gap = floor(gap / 2);
    end
end`
  }
];
