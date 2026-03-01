import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

interface MathRendererProps {
    math: string;
    block?: boolean;
    className?: string;
}

export default function MathRenderer({ math, block = false, className = "" }: MathRendererProps) {
    if (block) {
        return (
            <div className={`py-2 overflow-x-auto ${className}`}>
                <BlockMath math={math} />
            </div>
        );
    }

    return (
        <span className={className}>
            <InlineMath math={math} />
        </span>
    );
}
