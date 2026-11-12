"""校园活动报名项目。执行 python campus.py --help 查看命令。"""
import argparse
from copy import deepcopy
import json
from pathlib import Path
import sys
from tempfile import NamedTemporaryFile, TemporaryDirectory
from typing import Protocol


class Activity:
    """保持学号唯一、人数不超过容量。"""

    def __init__(self, title: str, capacity: int):
        if not isinstance(title, str) or not title.strip():
            raise ValueError("活动名称不能为空")
        if type(capacity) is not int or capacity < 0:
            raise ValueError("容量须为非负整数")
        self.title = title
        self._capacity = capacity
        self._students: dict[str, None] = {}

    @property
    def capacity(self) -> int:
        return self._capacity

    @property
    def students(self) -> tuple[str, ...]:
        return tuple(self._students)

    def register(self, raw_id: str) -> str:
        student_id = raw_id.strip()
        if not student_id:
            return "空学号"
        if student_id in self._students:
            return "重复"
        if len(self._students) >= self.capacity:
            return "满员"
        self._students[student_id] = None
        return "通过"


class Store(Protocol):
    def load(self) -> Activity:
        """读出独立的活动快照。"""
        ...

    def save(self, activity: Activity) -> None:
        """保存活动。如果失败，抛出异常。"""
        ...


class MemoryStore:
    def __init__(self, activity: Activity):
        self._activity = deepcopy(activity)

    def load(self) -> Activity:
        return deepcopy(self._activity)

    def save(self, activity: Activity) -> None:
        self._activity = deepcopy(activity)


def activity_from_data(data: object) -> Activity:
    required = {"title", "capacity", "students"}
    if not isinstance(data, dict) or not required <= data.keys():
        raise ValueError("名单缺少 title、capacity 或 students")
    activity = Activity(data["title"], data["capacity"])
    students = data["students"]
    if not isinstance(students, list):
        raise ValueError("students 必须是列表")
    for student_id in students:
        if not isinstance(student_id, str) or student_id != student_id.strip():
            raise ValueError("名单含格式错误的学号")
        status = activity.register(student_id)
        if status != "通过":
            raise ValueError(f"名单校验失败：{status}")
    return activity


class JsonStore:
    def __init__(self, path: Path):
        self.path = path

    def load(self) -> Activity:
        try:
            content = self.path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return Activity("博物馆参观", 2)
        return activity_from_data(json.loads(content))

    def save(self, activity: Activity) -> None:
        payload = {
            "title": activity.title,
            "capacity": activity.capacity,
            "students": list(activity.students),
        }
        temporary_path = None
        try:
            with NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=self.path.parent, delete=False
            ) as stream:
                temporary_path = Path(stream.name)
                json.dump(payload, stream, ensure_ascii=False, indent=2)
                stream.write("\n")
            temporary_path.replace(self.path)
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)


def submit(store: Store, raw_id: str) -> str:
    activity = store.load()
    status = activity.register(raw_id)
    if status == "通过":
        store.save(activity)
    return status


def demo() -> None:
    requests = [" S01 ", " ", "S02", "S03", "S01"]
    memory = MemoryStore(Activity("博物馆参观", 2))
    print("内存回执", [submit(memory, student_id) for student_id in requests])
    with TemporaryDirectory() as folder:
        path = Path(folder) / "roster.json"
        disk = JsonStore(path)
        print("文件回执", [submit(disk, student_id) for student_id in requests])
        print("重新读取", JsonStore(path).load().students)


def self_test() -> None:
    requests = [" S01 ", " ", "S02", "S03", "S01"]
    expected = ["通过", "空学号", "通过", "满员", "重复"]
    memory = MemoryStore(Activity("博物馆参观", 2))
    trial = memory.load()
    assert trial.register("S01") == "通过"
    assert memory.load().students == ()
    assert [submit(memory, student_id) for student_id in requests] == expected
    with TemporaryDirectory() as folder:
        path = Path(folder) / "roster.json"
        disk = JsonStore(path)
        assert submit(disk, " ") == "空学号"
        assert not path.exists()
        assert [submit(disk, student_id) for student_id in requests] == expected
        assert JsonStore(path).load().students == ("S01", "S02")
        invalid_contents = (
            "{损坏",
            '{"title":"博物馆","capacity":2,"students":["S01","S01"]}',
            '{"title":"博物馆","capacity":0,"students":["S01"]}',
        )
        for invalid in invalid_contents:
            path.write_text(invalid, encoding="utf-8")
            try:
                submit(disk, "S02")
            except ValueError:
                assert path.read_text(encoding="utf-8") == invalid
            else:
                raise AssertionError("应拒绝非法名单文件")
    print("项目验收通过")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, default=Path("roster.json"))
    parser.add_argument("--self-test", action="store_true")
    commands = parser.add_subparsers(dest="command")
    enroll = commands.add_parser("enroll", help="提交学号")
    enroll.add_argument("student_id")
    commands.add_parser("list", help="读取报名名单")
    args = parser.parse_args()

    if args.self_test:
        if args.command or not __debug__:
            parser.error("--self-test 需要在普通解释器模式下单独运行")
        self_test()
        return 0
    if args.command is None:
        demo()
        return 0
    store = JsonStore(args.file)
    try:
        if args.command == "enroll":
            print(submit(store, args.student_id))
        else:
            activity = store.load()
            print(f"{activity.title}（{len(activity.students)}/{activity.capacity}）")
            print("\n".join(activity.students) or "暂无报名")
    except (OSError, ValueError) as error:
        print(f"无法处理名单：{error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    if sys.platform == "emscripten":
        demo()
        self_test()
    else:
        raise SystemExit(main())
