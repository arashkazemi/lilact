const { PropTypes } = Lilact;

function UserCard({ name, age, tags, onClick }) {
  return (
    <div onClick={onClick} style={{border:'1px solid #ddd', padding:8, width:200}}>
      <h4>{name}</h4>
      <div>Age: {age}</div>
      <ul>{tags.map((t,i) => <li key={i}>{t}</li>)}</ul>
    </div>
  );
}

UserCard.propTypes = {
  name: PropTypes.string.isRequired,
  age: PropTypes.number,
  tags: PropTypes.arrayOf(PropTypes.string),
  onClick: PropTypes.func,
};

UserCard.defaultProps = {
  age: 0,
  tags: [],
  onClick: () => {},
};

/* App render */
function Demo() {
  return (
    <div><p>Check your browser console to see the logs.</p>
      <UserCard name="Alex" age={29} tags={['react','js']} />
      {/* Missing name -> will warn in dev console */}
      <UserCard age={"not-a-number"} />
    </div>
  );
}

module.exports = Demo;
