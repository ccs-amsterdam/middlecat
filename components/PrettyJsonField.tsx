import { FunctionComponent } from "react";

interface Props {
  json: any;
}

const PrettyJsonField: FunctionComponent<Props> = ({ json }) => {
  const txt = JSON.stringify(json, null, 2);
  return (
    <div className="JSON">
      <pre>{txt}</pre>
    </div>
  );
};

export default PrettyJsonField;
