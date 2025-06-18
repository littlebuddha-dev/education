import SkillLogForm from '@/components/SkillLogForm';

const [skillLogs, setSkillLogs] = useState([]);

useEffect(() => {
  fetch(`/api/children/${params.id}/skills`)  // ← 後でAPI作成
    .then(res => res.json())
    .then(setSkillLogs);
}, []);

const reloadSkills = () => {
  fetch(`/api/children/${params.id}/skills`)
    .then(res => res.json())
    .then(setSkillLogs);
};

...

<h3>スキルログ一覧</h3>
<ul>
  {skillLogs.map(log => (
    <li key={log.id}>
      {log.domain} - {log.score}点 ({new Date(log.recorded_at).toLocaleDateString()})
    </li>
  ))}
</ul>

<SkillLogForm childId={params.id} onSuccess={reloadSkills} />
