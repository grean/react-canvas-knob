import React from 'react';

class Knob extends React.Component {
  static propTypes = {
    value: React.PropTypes.number.isRequired,
    onChange: React.PropTypes.func.isRequired,
    min: React.PropTypes.number,
    max: React.PropTypes.number,
    step: React.PropTypes.number,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    thickness: React.PropTypes.number,
    lineCap: React.PropTypes.oneOf(['butt', 'round']),
    bgColor: React.PropTypes.string,
    fgColor: React.PropTypes.string,
    inputColor: React.PropTypes.string,
    font: React.PropTypes.string,
    fontWeight: React.PropTypes.string,
    clockwise: React.PropTypes.bool,
    cursor: React.PropTypes.oneOfType([
      React.PropTypes.number,
      React.PropTypes.bool,
    ]),
    stopper: React.PropTypes.bool,
    readOnly: React.PropTypes.bool,
    displayInput: React.PropTypes.bool,
    angleArc: React.PropTypes.number,
    angleOffset: React.PropTypes.number,
  };

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    width: 0, // actual default: width = height = 200px
    height: 0, // see `dimension` below
    thickness: 0.35,
    lineCap: 'butt',
    bgColor: '#EEE',
    fgColor: '#EA2',
    inputColor: '',
    font: 'Arial',
    fontWeight: 'bold',
    clockwise: true,
    cursor: false,
    stopper: true,
    readOnly: false,
    displayInput: true,
    angleArc: 360,
    angleOffset: 0,
  };

  constructor(props) {
    super(props);
    let dimension = 200; // default if neither width or height given
    if (this.props.width || this.props.height) {
      dimension = Math.max(this.props.width, this.props.height);
    }
    this.w = dimension;
    this.h = dimension;
    this.cursorExt = this.props.cursor === true ? 0.3 : this.props.cursor / 100;
    this.angleArc = this.props.angleArc * Math.PI / 180;
    this.angleOffset = this.props.angleOffset * Math.PI / 180;
    this.startAngle = (1.5 * Math.PI) + this.angleOffset;
    this.endAngle = (1.5 * Math.PI) + this.angleOffset + this.angleArc;
    this.digits = Math.max(
      String(Math.abs(this.props.min)).length,
      String(Math.abs(this.props.max)).length,
      2
    ) + 2;
  }

  componentDidMount() {
    this.drawCanvas();
  }

  componentDidUpdate() {
    this.drawCanvas();
  }

  getArcToValue = (v) => {
    let startAngle;
    let endAngle;
    const angle = ((v - this.props.min) * this.angleArc) / (this.props.max - this.props.min);
    if (!this.props.clockwise) {
      startAngle = this.endAngle + 0.00001;
      endAngle = startAngle - angle - 0.00001;
    } else {
      startAngle = this.startAngle - 0.00001;
      endAngle = startAngle + angle + 0.00001;
    }
    if (this.props.cursor) {
      startAngle = endAngle - this.cursorExt;
      endAngle += this.cursorExt;
    }
    return {
      startAngle,
      endAngle,
      acw: !this.props.clockwise && !this.props.cursor,
    };
  };

  enforceRange = (v) => ~~Math.max(Math.min(v, this.props.max), this.props.min);

  eventToValue = (e) => {
    const bounds = this.canvasRef.getBoundingClientRect();
    const x = e.pageX - bounds.left;
    const y = e.pageY - bounds.top;
    let a = Math.atan2(x - (this.w / 2), (this.w / 2) - y) - this.angleOffset;
    if (!this.props.clockwise) {
      a = this.angleArc - a - (2 * Math.PI);
    }
    if (this.angleArc !== Math.PI * 2 && (a < 0) && (a > -0.5)) {
      a = 0;
    } else if (a < 0) {
      a += Math.PI * 2;
    }
    let val = (a * (this.props.max - this.props.min) / this.angleArc) + this.props.min;
    val = Math.max(Math.min(val, this.props.max), this.props.min);
    val = (~~(((val < 0) ? -0.5 : 0.5) + (val / this.props.step))) * this.props.step;
    return Math.round(val * 100) / 100;
  };

  handleMouseDown = (e) => {
    this.props.onChange(this.eventToValue(e));
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('keyup', this.handleEsc);
  };

  handleMouseMove = (e) => {
    e.preventDefault();
    this.props.onChange(this.eventToValue(e));
  };

  handleMouseUp = () => {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('keyup', this.handleEsc);
  };

  handleTouchStart = (e) => {
    this.touchIndex = e.targetTouches.length - 1;
    this.props.onChange(this.eventToValue(e.targetTouches[this.touchIndex]));
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('touchend', this.handleTouchEnd);
  };

  handleTouchMove = (e) => {
    this.props.onChange(this.eventToValue(e.targetTouches[this.touchIndex]));
  };

  handleTouchEnd = () => {
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  };

  handleEsc = (e) => {
    if (e.keyCode === 27) {
      e.preventDefault();
      this.handleMouseUp();
    }
  };

  handleTextInput = (e) => {
    this.props.onChange(this.enforceRange(+e.target.value));
  };

  handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaX > 0 || e.deltaY > 0) {
      this.props.onChange(this.enforceRange(this.props.value + this.props.step));
    } else if (e.deltaX < 0 || e.deltaY < 0) {
      this.props.onChange(this.enforceRange(this.props.value - this.props.step));
    }
  };

  handleArrowKey = (e) => {
    if (e.keyCode === 37 || e.keyCode === 40) {
      e.preventDefault();
      this.props.onChange(this.enforceRange(this.props.value - this.props.step));
    } else if (e.keyCode === 38 || e.keyCode === 39) {
      e.preventDefault();
      this.props.onChange(this.enforceRange(this.props.value + this.props.step));
    }
  };

  inputStyle = () => ({
    width: `${((this.w / 2) + 4) >> 0}px`,
    height: `${(this.w / 3) >> 0}px`,
    position: 'absolute',
    verticalAlign: 'middle',
    marginTop: `${(this.w / 3) >> 0}px`,
    marginLeft: `-${((this.w * 3 / 4) + 2) >> 0}px`,
    border: 0,
    background: 'none',
    font: `${this.props.fontWeight} ${(this.w / this.digits) >> 0}px ${this.props.font}`,
    textAlign: 'center',
    color: this.props.inputColor || this.props.fgColor,
    padding: '0px',
    WebkitAppearance: 'none',
  });

  drawCanvas() {
    this.canvasRef.width = this.w; // clears the canvas
    this.canvasRef.height = this.h;
    const ctx = this.canvasRef.getContext('2d');
    this.xy = this.w / 2; // coordinates of canvas center
    this.lineWidth = this.xy * this.props.thickness;
    this.radius = this.xy - (this.lineWidth / 2);
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = this.props.lineCap;
    // background arc
    ctx.beginPath();
    ctx.strokeStyle = this.props.bgColor;
    ctx.arc(
      this.xy,
      this.xy,
      this.radius,
      this.endAngle - 0.00001,
      this.startAngle + 0.00001,
      true
    );
    ctx.stroke();
    // foreground arc
    const a = this.getArcToValue(this.props.value);
    ctx.beginPath();
    ctx.strokeStyle = this.props.fgColor;
    ctx.arc(
      this.xy,
      this.xy,
      this.radius,
      a.startAngle,
      a.endAngle,
      a.acw
    );
    ctx.stroke();
  }

  render = () => (
    <div
      style={{ width: this.w, height: this.h }}
      onWheel={this.props.readOnly ? null : this.handleWheel}
    >
      <canvas
        ref={(ref) => { this.canvasRef = ref; }}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={this.props.readOnly ? null : this.handleMouseDown}
        onTouchStart={this.props.readOnly ? null : this.handleTouchStart}
      />
      {this.props.displayInput ?
        <input
          style={this.inputStyle()}
          type="text" value={this.props.value}
          onChange={this.handleTextInput}
          onKeyDown={this.handleArrowKey}
          readOnly={this.props.readOnly}
        />
        : null
      }
    </div>
  );
}

export default Knob;
