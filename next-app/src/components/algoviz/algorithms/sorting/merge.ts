/**
 * 归并排序算法
 * 时间复杂度: O(n log n)
 * 空间复杂度: O(n)
 */

import type { AlgorithmDefinition } from '../../types';

export const mergeSortDefinition: AlgorithmDefinition = {
  id: 'merge',
  name: '归并排序',
  category: 'sorting',
  timeComplexity: 'O(n log n)',
  spaceComplexity: 'O(n)',
  description: '分治法，将数组分成两半分别排序，然后合并两个有序数组。稳定排序，适合链表排序。',
  code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  
  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }
  
  return result.concat(left.slice(i), right.slice(j));
}`,
  supportedViews: ['array']
};

// 代码模板
export const mergeSortTemplates = [
  {
    language: 'c',
    label: 'C',
    code: `void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    int L[n1], R[n2];
    // ... 合并逻辑
}`
  },
  {
    language: 'python',
    label: 'Python',
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`
  }
];
