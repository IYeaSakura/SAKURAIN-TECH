/**
 * 计数排序算法 (Counting Sort)
 * 时间复杂度: O(n + k)，k为数据范围
 * 空间复杂度: O(k)
 * 
 * 特点：
 * - 非比较排序
 * - 稳定排序
 * - 适用于数据范围较小的情况
 * - 时间复杂度为线性
 */

import type { AlgorithmDefinition } from '../../types';

export const countingSortDefinition: AlgorithmDefinition = {
  id: 'counting',
  name: '计数排序',
  category: 'sorting',
  timeComplexity: 'O(n + k)',
  spaceComplexity: 'O(k)',
  description: '非比较排序算法，通过统计每个元素出现的次数来进行排序。适用于数据范围较小的情况，时间复杂度为线性。',
  code: `function countingSort(arr) {
  if (arr.length === 0) return arr;
  
  // 找出最大值和最小值
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  
  // 创建计数数组
  const count = new Array(max - min + 1).fill(0);
  
  // 统计每个元素出现次数
  for (let i = 0; i < arr.length; i++) {
    count[arr[i] - min]++;
  }
  
  // 根据计数数组重构原数组
  let index = 0;
  for (let i = 0; i < count.length; i++) {
    while (count[i] > 0) {
      arr[index++] = i + min;
      count[i]--;
    }
  }
  
  return arr;
}`,
  supportedViews: ['array'],
  parameters: [
    { name: 'size', type: 'number', default: 20, min: 5, max: 50 }
  ]
};

// 代码模板
export const countingSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void countingSort(int arr[], int n) {
    if (n == 0) return;
    
    int max = arr[0], min = arr[0];
    for (int i = 1; i < n; i++) {
        if (arr[i] > max) max = arr[i];
        if (arr[i] < min) min = arr[i];
    }
    
    int range = max - min + 1;
    int count[range];
    memset(count, 0, sizeof(count));
    
    for (int i = 0; i < n; i++) {
        count[arr[i] - min]++;
    }
    
    int index = 0;
    for (int i = 0; i < range; i++) {
        while (count[i]--) {
            arr[index++] = i + min;
        }
    }
}`
  },
  {
    language: 'cpp',
    label: 'C++',
    code: `void countingSort(vector<int>& arr) {
    if (arr.empty()) return;
    
    int maxVal = *max_element(arr.begin(), arr.end());
    int minVal = *min_element(arr.begin(), arr.end());
    int range = maxVal - minVal + 1;
    
    vector<int> count(range, 0);
    for (int num : arr) {
        count[num - minVal]++;
    }
    
    int index = 0;
    for (int i = 0; i < range; i++) {
        while (count[i]-- > 0) {
            arr[index++] = i + minVal;
        }
    }
}`
  },
  {
    language: 'java',
    label: 'Java',
    code: `public static void countingSort(int[] arr) {
    if (arr.length == 0) return;
    
    int max = Arrays.stream(arr).max().getAsInt();
    int min = Arrays.stream(arr).min().getAsInt();
    int range = max - min + 1;
    
    int[] count = new int[range];
    for (int num : arr) {
        count[num - min]++;
    }
    
    int index = 0;
    for (int i = 0; i < range; i++) {
        while (count[i]-- > 0) {
            arr[index++] = i + min;
        }
    }
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def counting_sort(arr):
    if not arr:
        return arr
    
    max_val = max(arr)
    min_val = min(arr)
    count = [0] * (max_val - min_val + 1)
    
    for num in arr:
        count[num - min_val] += 1
    
    index = 0
    for i, cnt in enumerate(count):
        for _ in range(cnt):
            arr[index] = i + min_val
            index += 1
    return arr`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `function countingSort(arr) {
    if (arr.length === 0) return arr;
    
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const count = new Array(max - min + 1).fill(0);
    
    for (let num of arr) {
        count[num - min]++;
    }
    
    let index = 0;
    for (let i = 0; i < count.length; i++) {
        while (count[i]-- > 0) {
            arr[index++] = i + min;
        }
    }
    return arr;
}`
  },
  {
    language: 'go',
    label: 'Go',
    code: `func countingSort(arr []int) {
    if len(arr) == 0 {
        return
    }
    
    maxVal, minVal := arr[0], arr[0]
    for _, v := range arr {
        if v > maxVal { maxVal = v }
        if v < minVal { minVal = v }
    }
    
    count := make([]int, maxVal-minVal+1)
    for _, v := range arr {
        count[v-minVal]++
    }
    
    index := 0
    for i, c := range count {
        for c > 0 {
            arr[index] = i + minVal
            index++
            c--
        }
    }
}`
  },
  {
    language: 'rust',
    label: 'Rust',
    code: `fn counting_sort(arr: &mut [i32]) {
    if arr.is_empty() { return; }
    
    let max_val = *arr.iter().max().unwrap();
    let min_val = *arr.iter().min().unwrap();
    let mut count = vec![0; (max_val - min_val + 1) as usize];
    
    for &num in arr.iter() {
        count[(num - min_val) as usize] += 1;
    }
    
    let mut index = 0;
    for (i, &cnt) in count.iter().enumerate() {
        for _ in 0..cnt {
            arr[index] = i as i32 + min_val;
            index += 1;
        }
    }
}`
  },
  {
    language: 'csharp',
    label: 'C#',
    code: `public static void CountingSort(int[] arr) {
    if (arr.Length == 0) return;
    
    int max = arr.Max();
    int min = arr.Min();
    int[] count = new int[max - min + 1];
    
    foreach (int num in arr) {
        count[num - min]++;
    }
    
    int index = 0;
    for (int i = 0; i < count.Length; i++) {
        while (count[i]-- > 0) {
            arr[index++] = i + min;
        }
    }
}`
  },
  {
    language: 'matlab',
    label: 'MatLab',
    code: `function arr = countingSort(arr)
    if isempty(arr)
        return
    end
    
    maxVal = max(arr);
    minVal = min(arr);
    count = zeros(1, maxVal - minVal + 1);
    
    for i = 1:length(arr)
        count(arr(i) - minVal + 1) = count(arr(i) - minVal + 1) + 1;
    end
    
    index = 1;
    for i = 1:length(count)
        while count(i) > 0
            arr(index) = i + minVal - 1;
            index = index + 1;
            count(i) = count(i) - 1;
        end
    end
end`
  }
];
