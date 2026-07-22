/**
 * Algorithm Implementation Codes
 * Multi-language implementations for all algorithms
 */

export interface AlgorithmCode {
  id: string;
  name: string;
  languages: {
    [key: string]: string;
  };
}

export const ALGORITHM_CODES: AlgorithmCode[] = [
  {
    id: 'bubble',
    name: '冒泡排序',
    languages: {
      python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`,
      javascript: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`,
      java: `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
      cpp: `void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
      c: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
      go: `func bubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        for j := 0; j < n-i-1; j++ {
            if arr[j] > arr[j+1] {
                arr[j], arr[j+1] = arr[j+1], arr[j]
            }
        }
    }
}`,
      rust: `fn bubble_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        for j in 0..n-i-1 {
            if arr[j] > arr[j+1] {
                arr.swap(j, j+1);
            }
        }
    }
}`,
    },
  },
  {
    id: 'selection',
    name: '选择排序',
    languages: {
      python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
      javascript: `function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr;
}`,
      java: `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,
      cpp: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[i], arr[minIdx]);
    }
}`,
      c: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,
      go: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n-1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        arr[i], arr[minIdx] = arr[minIdx], arr[i]
    }
}`,
      rust: `fn selection_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in 0..n-1 {
        let mut min_idx = i;
        for j in i+1..n {
            if arr[j] < arr[min_idx] {
                min_idx = j;
            }
        }
        arr.swap(i, min_idx);
    }
}`,
    },
  },
  {
    id: 'insertion',
    name: '插入排序',
    languages: {
      python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
      javascript: `function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = key;
  }
  return arr;
}`,
      java: `public static void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
      cpp: `void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
      c: `void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
      go: `func insertionSort(arr []int) {
    for i := 1; i < len(arr); i++ {
        key := arr[i]
        j := i - 1
        for j >= 0 && arr[j] > key {
            arr[j+1] = arr[j]
            j--
        }
        arr[j+1] = key
    }
}`,
      rust: `fn insertion_sort(arr: &mut [i32]) {
    for i in 1..arr.len() {
        let key = arr[i];
        let mut j = i;
        while j > 0 && arr[j-1] > key {
            arr[j] = arr[j-1];
            j -= 1;
        }
        arr[j] = key;
    }
}`,
    },
  },
  {
    id: 'quick',
    name: '快速排序',
    languages: {
      python: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`,
      javascript: `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...quickSort(left), ...middle, ...quickSort(right)];
}`,
      java: `public static void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
      cpp: `void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            swap(arr[++i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}`,
      c: `void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            int temp = arr[++i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
      go: `func quickSort(arr []int, low, high int) {
    if low < high {
        pi := partition(arr, low, high)
        quickSort(arr, low, pi-1)
        quickSort(arr, pi+1, high)
    }
}

func partition(arr []int, low, high int) int {
    pivot := arr[high]
    i := low - 1
    for j := low; j < high; j++ {
        if arr[j] < pivot {
            i++
            arr[i], arr[j] = arr[j], arr[i]
        }
    }
    arr[i+1], arr[high] = arr[high], arr[i+1]
    return i + 1
}`,
      rust: `fn quick_sort(arr: &mut [i32]) {
    if arr.len() <= 1 {
        return;
    }
    let pivot_idx = partition(arr);
    quick_sort(&mut arr[..pivot_idx]);
    quick_sort(&mut arr[pivot_idx + 1..]);
}

fn partition(arr: &mut [i32]) -> usize {
    let len = arr.len();
    let pivot = arr[len - 1];
    let mut i = 0;
    for j in 0..len - 1 {
        if arr[j] < pivot {
            arr.swap(i, j);
            i += 1;
        }
    }
    arr.swap(i, len - 1);
    i
}`,
    },
  },
  {
    id: 'merge',
    name: '归并排序',
    languages: {
      python: `def merge_sort(arr):
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
    return result`,
      javascript: `function mergeSort(arr) {
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
  return [...result, ...left.slice(i), ...right.slice(j)];
}`,
      java: `public static void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

private static void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        temp[k++] = arr[i] <= arr[j] ? arr[i++] : arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    System.arraycopy(temp, 0, arr, left, temp.length);
}`,
      cpp: `void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        temp[k++] = arr[i] <= arr[j] ? arr[i++] : arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    copy(temp.begin(), temp.end(), arr.begin() + left);
}`,
      c: `void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

void merge(int arr[], int left, int mid, int right) {
    int temp[right - left + 1];
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        temp[k++] = arr[i] <= arr[j] ? arr[i++] : arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    for (int x = 0; x < k; x++) arr[left + x] = temp[x];
}`,
      go: `func mergeSort(arr []int) []int {
    if len(arr) <= 1 {
        return arr
    }
    mid := len(arr) / 2
    left := mergeSort(arr[:mid])
    right := mergeSort(arr[mid:])
    return merge(left, right)
}

func merge(left, right []int) []int {
    result := make([]int, 0, len(left)+len(right))
    i, j := 0, 0
    for i < len(left) && j < len(right) {
        if left[i] <= right[j] {
            result = append(result, left[i])
            i++
        } else {
            result = append(result, right[j])
            j++
        }
    }
    result = append(result, left[i:]...)
    result = append(result, right[j:]...)
    return result
}`,
      rust: `fn merge_sort(arr: &[i32]) -> Vec<i32> {
    if arr.len() <= 1 {
        return arr.to_vec();
    }
    let mid = arr.len() / 2;
    let left = merge_sort(&arr[..mid]);
    let right = merge_sort(&arr[mid..]);
    merge(&left, &right)
}

fn merge(left: &[i32], right: &[i32]) -> Vec<i32> {
    let mut result = Vec::with_capacity(left.len() + right.len());
    let mut i = 0;
    let mut j = 0;
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] {
            result.push(left[i]);
            i += 1;
        } else {
            result.push(right[j]);
            j += 1;
        }
    }
    result.extend_from_slice(&left[i..]);
    result.extend_from_slice(&right[j..]);
    result
}`,
    },
  },
  {
    id: 'heap',
    name: '堆排序',
    languages: {
      python: `def heap_sort(arr):
    n = len(arr)
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)
    for i in range(n - 1, 0, -1):
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    return arr

def heapify(arr, n, i):
    largest = i
    left = 2 * i + 1
    right = 2 * i + 2
    if left < n and arr[left] > arr[largest]:
        largest = left
    if right < n and arr[right] > arr[largest]:
        largest = right
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)`,
      javascript: `function heapSort(arr) {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr, n, i) {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  if (left < n && arr[left] > arr[largest]) largest = left;
  if (right < n && arr[right] > arr[largest]) largest = right;
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    heapify(arr, n, largest);
  }
}`,
      java: `public static void heapSort(int[] arr) {
    int n = arr.length;
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    for (int i = n - 1; i > 0; i--) {
        int temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        heapify(arr, i, 0);
    }
}

private static void heapify(int[] arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest != i) {
        int temp = arr[i];
        arr[i] = arr[largest];
        arr[largest] = temp;
        heapify(arr, n, largest);
    }
}`,
      cpp: `void heapSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    for (int i = n - 1; i > 0; i--) {
        swap(arr[0], arr[i]);
        heapify(arr, i, 0);
    }
}

void heapify(vector<int>& arr, int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest != i) {
        swap(arr[i], arr[largest]);
        heapify(arr, n, largest);
    }
}`,
      c: `void heapSort(int arr[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }
    for (int i = n - 1; i > 0; i--) {
        int temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        heapify(arr, i, 0);
    }
}

void heapify(int arr[], int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;
    if (largest != i) {
        int temp = arr[i];
        arr[i] = arr[largest];
        arr[largest] = temp;
        heapify(arr, n, largest);
    }
}`,
      go: `func heapSort(arr []int) {
    n := len(arr)
    for i := n/2 - 1; i >= 0; i-- {
        heapify(arr, n, i)
    }
    for i := n - 1; i > 0; i-- {
        arr[0], arr[i] = arr[i], arr[0]
        heapify(arr, i, 0)
    }
}

func heapify(arr []int, n, i int) {
    largest := i
    left := 2*i + 1
    right := 2*i + 2
    if left < n && arr[left] > arr[largest] {
        largest = left
    }
    if right < n && arr[right] > arr[largest] {
        largest = right
    }
    if largest != i {
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)
    }
}`,
      rust: `fn heap_sort(arr: &mut [i32]) {
    let n = arr.len();
    for i in (0..n/2).rev() {
        heapify(arr, n, i);
    }
    for i in (1..n).rev() {
        arr.swap(0, i);
        heapify(arr, i, 0);
    }
}

fn heapify(arr: &mut [i32], n: usize, i: usize) {
    let mut largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    if left < n && arr[left] > arr[largest] {
        largest = left;
    }
    if right < n && arr[right] > arr[largest] {
        largest = right;
    }
    if largest != i {
        arr.swap(i, largest);
        heapify(arr, n, largest);
    }
}`,
    },
  },
  {
    id: 'bfs',
    name: '广度优先搜索',
    languages: {
      python: `from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    result = []
    
    while queue:
        node = queue.popleft()
        if node not in visited:
            visited.add(node)
            result.append(node)
            for neighbor in graph[node]:
                if neighbor not in visited:
                    queue.append(neighbor)
    return result`,
      javascript: `function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  const result = [];
  
  while (queue.length > 0) {
    const node = queue.shift();
    if (!visited.has(node)) {
      visited.add(node);
      result.push(node);
      for (const neighbor of graph[node] || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }
  return result;
}`,
      java: `public static List<Integer> bfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    List<Integer> result = new ArrayList<>();
    
    queue.offer(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        if (!visited.contains(node)) {
            visited.add(node);
            result.add(node);
            for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
                if (!visited.contains(neighbor)) {
                    queue.offer(neighbor);
                }
            }
        }
    }
    return result;
}`,
      cpp: `vector<int> bfs(unordered_map<int, vector<int>>& graph, int start) {
    unordered_set<int> visited;
    queue<int> q;
    vector<int> result;
    
    q.push(start);
    while (!q.empty()) {
        int node = q.front();
        q.pop();
        if (visited.find(node) == visited.end()) {
            visited.insert(node);
            result.push_back(node);
            for (int neighbor : graph[node]) {
                if (visited.find(neighbor) == visited.end()) {
                    q.push(neighbor);
                }
            }
        }
    }
    return result;
}`,
      c: `void bfs(int** graph, int* graphSize, int start, int* result, int* resultSize) {
    int visited[MAX_NODES] = {0};
    int queue[MAX_NODES];
    int front = 0, rear = 0;
    *resultSize = 0;
    
    queue[rear++] = start;
    while (front < rear) {
        int node = queue[front++];
        if (!visited[node]) {
            visited[node] = 1;
            result[(*resultSize)++] = node;
            for (int i = 0; i < graphSize[node]; i++) {
                if (!visited[graph[node][i]]) {
                    queue[rear++] = graph[node][i];
                }
            }
        }
    }
}`,
      go: `func bfs(graph map[int][]int, start int) []int {
    visited := make(map[int]bool)
    queue := []int{start}
    result := []int{}
    
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        if !visited[node] {
            visited[node] = true
            result = append(result, node)
            for _, neighbor := range graph[node] {
                if !visited[neighbor] {
                    queue = append(queue, neighbor)
                }
            }
        }
    }
    return result
}`,
      rust: `fn bfs(graph: &HashMap<i32, Vec<i32>>, start: i32) -> Vec<i32> {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    let mut result = Vec::new();
    
    queue.push_back(start);
    while let Some(node) = queue.pop_front() {
        if visited.insert(node) {
            result.push(node);
            if let Some(neighbors) = graph.get(&node) {
                for &neighbor in neighbors {
                    if !visited.contains(&neighbor) {
                        queue.push_back(neighbor);
                    }
                }
            }
        }
    }
    result
}`,
    },
  },
  {
    id: 'dfs',
    name: '深度优先搜索',
    languages: {
      python: `def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    result = [start]
    
    for neighbor in graph[start]:
        if neighbor not in visited:
            result.extend(dfs(graph, neighbor, visited))
    return result`,
      javascript: `function dfs(graph, start, visited = new Set()) {
  visited.add(start);
  const result = [start];
  
  for (const neighbor of graph[start] || []) {
    if (!visited.has(neighbor)) {
      result.push(...dfs(graph, neighbor, visited));
    }
  }
  return result;
}`,
      java: `public static List<Integer> dfs(Map<Integer, List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    List<Integer> result = new ArrayList<>();
    dfsHelper(graph, start, visited, result);
    return result;
}

private static void dfsHelper(Map<Integer, List<Integer>> graph, int node, 
                               Set<Integer> visited, List<Integer> result) {
    visited.add(node);
    result.add(node);
    for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {
        if (!visited.contains(neighbor)) {
            dfsHelper(graph, neighbor, visited, result);
        }
    }
}`,
      cpp: `vector<int> dfs(unordered_map<int, vector<int>>& graph, int start) {
    unordered_set<int> visited;
    vector<int> result;
    dfsHelper(graph, start, visited, result);
    return result;
}

void dfsHelper(unordered_map<int, vector<int>>& graph, int node,
               unordered_set<int>& visited, vector<int>& result) {
    visited.insert(node);
    result.push_back(node);
    for (int neighbor : graph[node]) {
        if (visited.find(neighbor) == visited.end()) {
            dfsHelper(graph, neighbor, visited, result);
        }
    }
}`,
      c: `void dfs(int** graph, int* graphSize, int node, int* visited, int* result, int* resultSize) {
    visited[node] = 1;
    result[(*resultSize)++] = node;
    for (int i = 0; i < graphSize[node]; i++) {
        if (!visited[graph[node][i]]) {
            dfs(graph, graphSize, graph[node][i], visited, result, resultSize);
        }
    }
}`,
      go: `func dfs(graph map[int][]int, start int) []int {
    visited := make(map[int]bool)
    result := []int{}
    dfsHelper(graph, start, visited, &result)
    return result
}

func dfsHelper(graph map[int][]int, node int, visited map[int]bool, result *[]int) {
    visited[node] = true
    *result = append(*result, node)
    for _, neighbor := range graph[node] {
        if !visited[neighbor] {
            dfsHelper(graph, neighbor, visited, result)
        }
    }
}`,
      rust: `fn dfs(graph: &HashMap<i32, Vec<i32>>, start: i32) -> Vec<i32> {
    let mut visited = HashSet::new();
    let mut result = Vec::new();
    dfs_helper(graph, start, &mut visited, &mut result);
    result
}

fn dfs_helper(graph: &HashMap<i32, Vec<i32>>, node: i32, 
              visited: &mut HashSet<i32>, result: &mut Vec<i32>) {
    visited.insert(node);
    result.push(node);
    if let Some(neighbors) = graph.get(&node) {
        for &neighbor in neighbors {
            if !visited.contains(&neighbor) {
                dfs_helper(graph, neighbor, visited, result);
            }
        }
    }
}`,
    },
  },
  {
    id: 'dijkstra',
    name: 'Dijkstra算法',
    languages: {
      python: `import heapq

def dijkstra(graph, start):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    
    while pq:
        dist, node = heapq.heappop(pq)
        if dist > distances[node]:
            continue
        for neighbor, weight in graph[node]:
            new_dist = dist + weight
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(pq, (new_dist, neighbor))
    return distances`,
      javascript: `function dijkstra(graph, start) {
  const distances = {};
  const pq = [[0, start]];
  
  for (const node in graph) distances[node] = Infinity;
  distances[start] = 0;
  
  while (pq.length > 0) {
    pq.sort((a, b) => a[0] - b[0]);
    const [dist, node] = pq.shift();
    if (dist > distances[node]) continue;
    
    for (const [neighbor, weight] of graph[node] || []) {
      const newDist = dist + weight;
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        pq.push([newDist, neighbor]);
      }
    }
  }
  return distances;
}`,
      java: `public static Map<Integer, Integer> dijkstra(Map<Integer, List<int[]>> graph, int start) {
    Map<Integer, Integer> distances = new HashMap<>();
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    
    for (int node : graph.keySet()) distances.put(node, Integer.MAX_VALUE);
    distances.put(start, 0);
    pq.offer(new int[]{0, start});
    
    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int dist = curr[0], node = curr[1];
        if (dist > distances.get(node)) continue;
        
        for (int[] edge : graph.getOrDefault(node, new ArrayList<>())) {
            int neighbor = edge[0], weight = edge[1];
            int newDist = dist + weight;
            if (newDist < distances.get(neighbor)) {
                distances.put(neighbor, newDist);
                pq.offer(new int[]{newDist, neighbor});
            }
        }
    }
    return distances;
}`,
      cpp: `unordered_map<int, int> dijkstra(unordered_map<int, vector<pair<int, int>>>& graph, int start) {
    unordered_map<int, int> distances;
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
    
    for (auto& [node, _] : graph) distances[node] = INT_MAX;
    distances[start] = 0;
    pq.push({0, start});
    
    while (!pq.empty()) {
        auto [dist, node] = pq.top();
        pq.pop();
        if (dist > distances[node]) continue;
        
        for (auto& [neighbor, weight] : graph[node]) {
            int newDist = dist + weight;
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                pq.push({newDist, neighbor});
            }
        }
    }
    return distances;
}`,
      c: `void dijkstra(int** graph, int n, int start, int* distances) {
    int visited[MAX_NODES] = {0};
    for (int i = 0; i < n; i++) distances[i] = INT_MAX;
    distances[start] = 0;
    
    for (int count = 0; count < n - 1; count++) {
        int minDist = INT_MAX, u = -1;
        for (int v = 0; v < n; v++) {
            if (!visited[v] && distances[v] < minDist) {
                minDist = distances[v];
                u = v;
            }
        }
        visited[u] = 1;
        for (int v = 0; v < n; v++) {
            if (!visited[v] && graph[u][v] && distances[u] != INT_MAX 
                && distances[u] + graph[u][v] < distances[v]) {
                distances[v] = distances[u] + graph[u][v];
            }
        }
    }
}`,
      go: `func dijkstra(graph map[int][][2]int, start int) map[int]int {
    distances := make(map[int]int)
    pq := make(PriorityQueue, 0)
    heap.Init(&pq)
    
    for node := range graph {
        distances[node] = math.MaxInt32
    }
    distances[start] = 0
    heap.Push(&pq, &Item{value: start, priority: 0})
    
    for pq.Len() > 0 {
        item := heap.Pop(&pq).(*Item)
        node := item.value
        dist := item.priority
        
        if dist > distances[node] {
            continue
        }
        for _, edge := range graph[node] {
            neighbor, weight := edge[0], edge[1]
            newDist := dist + weight
            if newDist < distances[neighbor] {
                distances[neighbor] = newDist
                heap.Push(&pq, &Item{value: neighbor, priority: newDist})
            }
        }
    }
    return distances
}`,
      rust: `fn dijkstra(graph: &HashMap<i32, Vec<(i32, i32)>>, start: i32) -> HashMap<i32, i32> {
    let mut distances: HashMap<i32, i32> = graph.keys().map(|&k| (k, i32::MAX)).collect();
    let mut pq = BinaryHeap::new();
    
    distances.insert(start, 0);
    pq.push(Reverse((0, start)));
    
    while let Some(Reverse((dist, node))) = pq.pop() {
        if dist > distances[&node] { continue; }
        
        if let Some(edges) = graph.get(&node) {
            for &(neighbor, weight) in edges {
                let new_dist = dist + weight;
                if new_dist < distances[&neighbor] {
                    distances.insert(neighbor, new_dist);
                    pq.push(Reverse((new_dist, neighbor)));
                }
            }
        }
    }
    distances
}`,
    },
  },
  {
    id: 'perceptron',
    name: '感知机',
    languages: {
      python: `import numpy as np

class Perceptron:
    def __init__(self, learning_rate=0.1, n_iterations=100):
        self.lr = learning_rate
        self.n_iter = n_iterations
        self.weights = None
        self.bias = None
    
    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0
        
        for _ in range(self.n_iter):
            for idx, x_i in enumerate(X):
                linear_output = np.dot(x_i, self.weights) + self.bias
                y_pred = np.where(linear_output >= 0, 1, -1)
                
                if y_pred != y[idx]:
                    self.weights += self.lr * y[idx] * x_i
                    self.bias += self.lr * y[idx]
    
    def predict(self, X):
        linear_output = np.dot(X, self.weights) + self.bias
        return np.where(linear_output >= 0, 1, -1)`,
      javascript: `class Perceptron {
  constructor(learningRate = 0.1, iterations = 100) {
    this.lr = learningRate;
    this.iterations = iterations;
    this.weights = null;
    this.bias = null;
  }
  
  fit(X, y) {
    const nFeatures = X[0].length;
    this.weights = new Array(nFeatures).fill(0);
    this.bias = 0;
    
    for (let iter = 0; iter < this.iterations; iter++) {
      for (let i = 0; i < X.length; i++) {
        const linear = X[i].reduce((sum, x, j) => sum + x * this.weights[j], 0) + this.bias;
        const pred = linear >= 0 ? 1 : -1;
        
        if (pred !== y[i]) {
          for (let j = 0; j < nFeatures; j++) {
            this.weights[j] += this.lr * y[i] * X[i][j];
          }
          this.bias += this.lr * y[i];
        }
      }
    }
  }
  
  predict(X) {
    return X.map(x => {
      const linear = x.reduce((sum, xi, j) => sum + xi * this.weights[j], 0) + this.bias;
      return linear >= 0 ? 1 : -1;
    });
  }
}`,
      java: `public class Perceptron {
    private double[] weights;
    private double bias;
    private double learningRate;
    private int iterations;
    
    public Perceptron(double learningRate, int iterations) {
        this.learningRate = learningRate;
        this.iterations = iterations;
    }
    
    public void fit(double[][] X, int[] y) {
        int nFeatures = X[0].length;
        weights = new double[nFeatures];
        bias = 0;
        
        for (int iter = 0; iter < iterations; iter++) {
            for (int i = 0; i < X.length; i++) {
                double linear = bias;
                for (int j = 0; j < nFeatures; j++) {
                    linear += X[i][j] * weights[j];
                }
                int pred = linear >= 0 ? 1 : -1;
                
                if (pred != y[i]) {
                    for (int j = 0; j < nFeatures; j++) {
                        weights[j] += learningRate * y[i] * X[i][j];
                    }
                    bias += learningRate * y[i];
                }
            }
        }
    }
}`,
      cpp: `class Perceptron {
private:
    vector<double> weights;
    double bias;
    double learningRate;
    int iterations;
    
public:
    Perceptron(double lr = 0.1, int iter = 100) 
        : learningRate(lr), iterations(iter), bias(0) {}
    
    void fit(const vector<vector<double>>& X, const vector<int>& y) {
        int nFeatures = X[0].size();
        weights.assign(nFeatures, 0);
        bias = 0;
        
        for (int iter = 0; iter < iterations; iter++) {
            for (size_t i = 0; i < X.size(); i++) {
                double linear = bias;
                for (int j = 0; j < nFeatures; j++) {
                    linear += X[i][j] * weights[j];
                }
                int pred = linear >= 0 ? 1 : -1;
                
                if (pred != y[i]) {
                    for (int j = 0; j < nFeatures; j++) {
                        weights[j] += learningRate * y[i] * X[i][j];
                    }
                    bias += learningRate * y[i];
                }
            }
        }
    }
};`,
      c: `typedef struct {
    double* weights;
    double bias;
    double learning_rate;
    int iterations;
    int n_features;
} Perceptron;

void perceptron_fit(Perceptron* p, double** X, int* y, int n_samples) {
    for (int iter = 0; iter < p->iterations; iter++) {
        for (int i = 0; i < n_samples; i++) {
            double linear = p->bias;
            for (int j = 0; j < p->n_features; j++) {
                linear += X[i][j] * p->weights[j];
            }
            int pred = linear >= 0 ? 1 : -1;
            
            if (pred != y[i]) {
                for (int j = 0; j < p->n_features; j++) {
                    p->weights[j] += p->learning_rate * y[i] * X[i][j];
                }
                p->bias += p->learning_rate * y[i];
            }
        }
    }
}`,
      go: `type Perceptron struct {
    weights      []float64
    bias         float64
    learningRate float64
    iterations   int
}

func (p *Perceptron) Fit(X [][]float64, y []int) {
    nFeatures := len(X[0])
    p.weights = make([]float64, nFeatures)
    p.bias = 0
    
    for iter := 0; iter < p.iterations; iter++ {
        for i, x := range X {
            linear := p.bias
            for j, xi := range x {
                linear += xi * p.weights[j]
            }
            pred := -1
            if linear >= 0 {
                pred = 1
            }
            
            if pred != y[i] {
                for j, xi := range x {
                    p.weights[j] += p.learningRate * float64(y[i]) * xi
                }
                p.bias += p.learningRate * float64(y[i])
            }
        }
    }
}`,
      rust: `struct Perceptron {
    weights: Vec<f64>,
    bias: f64,
    learning_rate: f64,
    iterations: i32,
}

impl Perceptron {
    fn fit(&mut self, X: &[Vec<f64>], y: &[i32]) {
        let n_features = X[0].len();
        self.weights = vec![0.0; n_features];
        self.bias = 0.0;
        
        for _ in 0..self.iterations {
            for (i, x) in X.iter().enumerate() {
                let linear: f64 = x.iter()
                    .zip(self.weights.iter())
                    .map(|(xi, wi)| xi * wi)
                    .sum::<f64>() + self.bias;
                let pred = if linear >= 0.0 { 1 } else { -1 };
                
                if pred != y[i] {
                    for (j, xi) in x.iter().enumerate() {
                        self.weights[j] += self.learning_rate * y[i] as f64 * xi;
                    }
                    self.bias += self.learning_rate * y[i] as f64;
                }
            }
        }
    }
}`,
    },
  },
  {
    id: 'kmeans',
    name: 'K-Means聚类',
    languages: {
      python: `import numpy as np

def kmeans(X, k, max_iters=100):
    centroids = X[np.random.choice(X.shape[0], k, replace=False)]
    
    for _ in range(max_iters):
        distances = np.sqrt(((X[:, np.newaxis] - centroids) ** 2).sum(axis=2))
        labels = np.argmin(distances, axis=1)
        
        new_centroids = np.array([
            X[labels == i].mean(axis=0) if np.sum(labels == i) > 0 else centroids[i]
            for i in range(k)
        ])
        
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids
    
    return labels, centroids`,
      javascript: `function kmeans(X, k, maxIterations = 100) {
  let centroids = X.slice(0, k);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    const labels = X.map(point => {
      let minDist = Infinity;
      let label = 0;
      centroids.forEach((centroid, i) => {
        const dist = Math.sqrt(
          point.reduce((sum, val, j) => sum + Math.pow(val - centroid[j], 2), 0)
        );
        if (dist < minDist) {
          minDist = dist;
          label = i;
        }
      });
      return label;
    });
    
    const newCentroids = [];
    for (let i = 0; i < k; i++) {
      const clusterPoints = X.filter((_, j) => labels[j] === i);
      if (clusterPoints.length > 0) {
        newCentroids[i] = clusterPoints[0].map((_, dim) => 
          clusterPoints.reduce((sum, p) => sum + p[dim], 0) / clusterPoints.length
        );
      } else {
        newCentroids[i] = centroids[i];
      }
    }
    
    centroids = newCentroids;
  }
  
  return { labels, centroids };
}`,
      java: `public class KMeans {
    public static Result kmeans(double[][] X, int k, int maxIterations) {
        double[][] centroids = new double[k][];
        for (int i = 0; i < k; i++) centroids[i] = X[i].clone();
        
        int[] labels = new int[X.length];
        
        for (int iter = 0; iter < maxIterations; iter++) {
            for (int i = 0; i < X.length; i++) {
                double minDist = Double.MAX_VALUE;
                for (int j = 0; j < k; j++) {
                    double dist = 0;
                    for (int d = 0; d < X[i].length; d++) {
                        dist += Math.pow(X[i][d] - centroids[j][d], 2);
                    }
                    if (dist < minDist) {
                        minDist = dist;
                        labels[i] = j;
                    }
                }
            }
            
            for (int j = 0; j < k; j++) {
                double[] sum = new double[X[0].length];
                int count = 0;
                for (int i = 0; i < X.length; i++) {
                    if (labels[i] == j) {
                        for (int d = 0; d < X[i].length; d++) {
                            sum[d] += X[i][d];
                        }
                        count++;
                    }
                }
                if (count > 0) {
                    for (int d = 0; d < sum.length; d++) {
                        centroids[j][d] = sum[d] / count;
                    }
                }
            }
        }
        return new Result(labels, centroids);
    }
}`,
      cpp: `pair<vector<int>, vector<vector<double>>> kmeans(vector<vector<double>>& X, int k, int maxIterations) {
    vector<vector<double>> centroids(X.begin(), X.begin() + k);
    vector<int> labels(X.size());
    
    for (int iter = 0; iter < maxIterations; iter++) {
        for (size_t i = 0; i < X.size(); i++) {
            double minDist = numeric_limits<double>::max();
            for (int j = 0; j < k; j++) {
                double dist = 0;
                for (size_t d = 0; d < X[i].size(); d++) {
                    dist += pow(X[i][d] - centroids[j][d], 2);
                }
                if (dist < minDist) {
                    minDist = dist;
                    labels[i] = j;
                }
            }
        }
        
        for (int j = 0; j < k; j++) {
            vector<double> sum(X[0].size(), 0);
            int count = 0;
            for (size_t i = 0; i < X.size(); i++) {
                if (labels[i] == j) {
                    for (size_t d = 0; d < X[i].size(); d++) {
                        sum[d] += X[i][d];
                    }
                    count++;
                }
            }
            if (count > 0) {
                for (size_t d = 0; d < sum.size(); d++) {
                    centroids[j][d] = sum[d] / count;
                }
            }
        }
    }
    return {labels, centroids};
}`,
      c: `void kmeans(double** X, int n_samples, int n_features, int k, int max_iterations,
              int* labels, double** centroids) {
    for (int i = 0; i < k; i++) {
        for (int j = 0; j < n_features; j++) {
            centroids[i][j] = X[i][j];
        }
    }
    
    for (int iter = 0; iter < max_iterations; iter++) {
        for (int i = 0; i < n_samples; i++) {
            double min_dist = DBL_MAX;
            for (int j = 0; j < k; j++) {
                double dist = 0;
                for (int d = 0; d < n_features; d++) {
                    dist += pow(X[i][d] - centroids[j][d], 2);
                }
                if (dist < min_dist) {
                    min_dist = dist;
                    labels[i] = j;
                }
            }
        }
        
        for (int j = 0; j < k; j++) {
            double sum[n_features];
            int count = 0;
            memset(sum, 0, sizeof(sum));
            for (int i = 0; i < n_samples; i++) {
                if (labels[i] == j) {
                    for (int d = 0; d < n_features; d++) {
                        sum[d] += X[i][d];
                    }
                    count++;
                }
            }
            if (count > 0) {
                for (int d = 0; d < n_features; d++) {
                    centroids[j][d] = sum[d] / count;
                }
            }
        }
    }
}`,
      go: `func kmeans(X [][]float64, k, maxIterations int) (labels []int, centroids [][]float64) {
    centroids = make([][]float64, k)
    for i := 0; i < k; i++ {
        centroids[i] = make([]float64, len(X[0]))
        copy(centroids[i], X[i])
    }
    labels = make([]int, len(X))
    
    for iter := 0; iter < maxIterations; iter++ {
        for i, point := range X {
            minDist := math.MaxFloat64
            for j, centroid := range centroids {
                dist := 0.0
                for d, val := range point {
                    dist += math.Pow(val-centroid[d], 2)
                }
                if dist < minDist {
                    minDist = dist
                    labels[i] = j
                }
            }
        }
        
        for j := 0; j < k; j++ {
            sum := make([]float64, len(X[0]))
            count := 0
            for i, label := range labels {
                if label == j {
                    for d, val := range X[i] {
                        sum[d] += val
                    }
                    count++
                }
            }
            if count > 0 {
                for d := range sum {
                    centroids[j][d] = sum[d] / float64(count)
                }
            }
        }
    }
    return
}`,
      rust: `fn kmeans(X: &[Vec<f64>], k: usize, max_iterations: usize) -> (Vec<usize>, Vec<Vec<f64>>) {
    let mut centroids: Vec<Vec<f64>> = X.iter().take(k).cloned().collect();
    let mut labels = vec![0; X.len()];
    
    for _ in 0..max_iterations {
        for (i, point) in X.iter().enumerate() {
            let mut min_dist = f64::MAX;
            for (j, centroid) in centroids.iter().enumerate() {
                let dist: f64 = point.iter()
                    .zip(centroid.iter())
                    .map(|(p, c)| (p - c).powi(2))
                    .sum();
                if dist < min_dist {
                    min_dist = dist;
                    labels[i] = j;
                }
            }
        }
        
        for (j, centroid) in centroids.iter_mut().enumerate() {
            let mut sum = vec![0.0; centroid.len()];
            let mut count = 0;
            for (i, point) in X.iter().enumerate() {
                if labels[i] == j {
                    for (d, val) in point.iter().enumerate() {
                        sum[d] += val;
                    }
                    count += 1;
                }
            }
            if count > 0 {
                for (d, s) in sum.iter().enumerate() {
                    centroid[d] = s / count as f64;
                }
            }
        }
    }
    (labels, centroids)
}`,
    },
  },
  {
    id: 'gradient',
    name: '梯度下降',
    languages: {
      python: `def gradient_descent(f, df, x0, learning_rate=0.1, max_iterations=1000, tolerance=1e-6):
    x = x0
    for i in range(max_iterations):
        gradient = df(x)
        new_x = x - learning_rate * gradient
        
        if abs(new_x - x) < tolerance:
            break
        x = new_x
    
    return x

# Example: minimize f(x) = x^2
f = lambda x: x**2
df = lambda x: 2*x
minimum = gradient_descent(f, df, x0=3.0)`,
      javascript: `function gradientDescent(df, x0, learningRate = 0.1, maxIterations = 1000, tolerance = 1e-6) {
  let x = x0;
  
  for (let i = 0; i < maxIterations; i++) {
    const gradient = df(x);
    const newX = x - learningRate * gradient;
    
    if (Math.abs(newX - x) < tolerance) break;
    x = newX;
  }
  
  return x;
}

// Example: minimize f(x) = x^2
const df = x => 2 * x;
const minimum = gradientDescent(df, 3.0);`,
      java: `public class GradientDescent {
    public static double minimize(DoubleFunction<Double> df, double x0, 
                                  double learningRate, int maxIterations, double tolerance) {
        double x = x0;
        
        for (int i = 0; i < maxIterations; i++) {
            double gradient = df.apply(x);
            double newX = x - learningRate * gradient;
            
            if (Math.abs(newX - x) < tolerance) break;
            x = newX;
        }
        
        return x;
    }
    
    // Example usage
    public static void main(String[] args) {
        double minimum = minimize(x -> 2 * x, 3.0, 0.1, 1000, 1e-6);
    }
}`,
      cpp: `double gradientDescent(function<double(double)> df, double x0, 
                           double learningRate = 0.1, int maxIterations = 1000, 
                           double tolerance = 1e-6) {
    double x = x0;
    
    for (int i = 0; i < maxIterations; i++) {
        double gradient = df(x);
        double newX = x - learningRate * gradient;
        
        if (abs(newX - x) < tolerance) break;
        x = newX;
    }
    
    return x;
}

// Example: minimize f(x) = x^2
int main() {
    auto df = [](double x) { return 2 * x; };
    double minimum = gradientDescent(df, 3.0);
}`,
      c: `double gradient_descent(double (*df)(double), double x0, 
                         double learning_rate, int max_iterations, double tolerance) {
    double x = x0;
    
    for (int i = 0; i < max_iterations; i++) {
        double gradient = df(x);
        double new_x = x - learning_rate * gradient;
        
        if (fabs(new_x - x) < tolerance) break;
        x = new_x;
    }
    
    return x;
}

// Example: minimize f(x) = x^2
double df(double x) { return 2 * x; }
double minimum = gradient_descent(df, 3.0, 0.1, 1000, 1e-6);`,
      go: `func gradientDescent(df func(float64) float64, x0, learningRate float64, 
                        maxIterations int, tolerance float64) float64 {
    x := x0
    
    for i := 0; i < maxIterations; i++ {
        gradient := df(x)
        newX := x - learningRate*gradient
        
        if math.Abs(newX-x) < tolerance {
            break
        }
        x = newX
    }
    
    return x
}

// Example: minimize f(x) = x^2
func main() {
    df := func(x float64) float64 { return 2 * x }
    minimum := gradientDescent(df, 3.0, 0.1, 1000, 1e-6)
}`,
      rust: `fn gradient_descent<F>(df: F, x0: f64, learning_rate: f64, 
                        max_iterations: usize, tolerance: f64) -> f64
where
    F: Fn(f64) -> f64,
{
    let mut x = x0;
    
    for _ in 0..max_iterations {
        let gradient = df(x);
        let new_x = x - learning_rate * gradient;
        
        if (new_x - x).abs() < tolerance {
            break;
        }
        x = new_x;
    }
    
    x
}

// Example: minimize f(x) = x^2
fn main() {
    let minimum = gradient_descent(|x| 2.0 * x, 3.0, 0.1, 1000, 1e-6);
}`,
    },
  },
];

export const LANGUAGE_LABELS: { [key: string]: string } = {
  python: 'Python',
  javascript: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  go: 'Go',
  rust: 'Rust',
};

export const LANGUAGE_PRISM_NAMES: { [key: string]: string } = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust',
};
